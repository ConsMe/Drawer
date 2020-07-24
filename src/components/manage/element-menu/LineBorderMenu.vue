<template>
  <div>
    <form @submit.prevent="setBorderLength">
      <div class="form-group row no-gutters">
        <label class="col-auto col-form-label text-left">Длина</label>
        <div class="col-auto px-1">
          <input type="text" class="form-control" v-model="lengthInMm">
        </div>
        <span class="col-auto d-flex align-items-center">мм</span>
      </div>
      <div class="form-group row no-gutters">
        <div class="col-auto text-left">
          <button type="submit" class="btn btn-primary">Установить</button>
        </div>
        <div class="col-auto">
          <change-line-by-end
            :element="element"
            :points="points"
            @setChoosedPoint="choosedPoint = $event" />
        </div>
      </div>
    </form>
  </div>
</template>

<script>
import ChangeLineByEnd from './ChangeLineByEnd.vue';
import confirmModal from '../../../modules/ConfirmModal';

export default {
  components: { ChangeLineByEnd },
  data() {
    return {
      choosedPoint: null,
      lengthInMm: 0,
    };
  },
  computed: {
    selectedEl() { return this.$store.getters.selectedEl; },
    part() { return this.$store.state.parts.partsInit[this.selectedEl.i]; },
    element() { return this.selectedEl.el; },
    elementId() { return this.element.id; },
    points() {
      const curIndex = this.selectedEl.j;
      const nextIndex = curIndex < this.part.points.length - 1 ? curIndex + 1 : 0;
      const p1 = this.part.points[curIndex];
      const p2 = this.part.points[nextIndex];
      const pts = [
        { x: p1.c[0], y: p1.c[1], id: p1.id },
        { x: p2.c[0], y: p2.c[1], id: p2.id },
      ].sort((pt1, pt2) => pt1.x - pt2.x);
      if (pts[0].x === pts[1].x) pts.sort((pt1, pt2) => pt1.y - pt2.y);
      return pts;
    },
    pxPerMm() { return this.$store.state.pxPerMm; },
    currentLengthInMm() {
      const [p1, p2] = this.points;
      const length = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
      return Math.round(length);
    },
  },
  watch: {
    points: {
      handler() {
        this.getLength();
      },
      immediate: true,
    },
  },
  methods: {
    getLength() {
      this.lengthInMm = this.currentLengthInMm;
    },
    async setBorderLength() {
      const { m, n } = this.getLinearEquation();
      const pts = this.points;
      const nums = this.choosedPoint === 'both' ? [0, 1] : [this.choosedPoint];
      const newCoords = [];
      const currentLength = this.currentLengthInMm;
      const diffX = (pts[0].x - pts[1].x) / currentLength;
      const newLength = this.lengthInMm;
      nums.forEach((num) => {
        const p = this.clone(pts[num]);
        const other = !num ? this.clone(pts[1]) : this.clone(pts[0]);
        const diffLength = this.choosedPoint === 'both'
          ? (newLength - currentLength) / 2 : newLength - currentLength;
        if (p.x === other.x) {
          const sign = p.y > other.y ? 1 : -1;
          p.y += diffLength * sign;
        } else if (p.y === other.y) {
          const sign = p.x > other.x ? 1 : -1;
          p.x += diffLength * sign;
        } else {
          const sign = (p.y > other.y && m < 0) || (p.y < other.y && m > 0) ? 1 : -1;
          const addX = diffX * diffLength * sign;
          p.x += addX;
          p.y = p.x * m + n;
        }
        newCoords.push(p);
      });
      const { i } = this.selectedEl;
      const radiuses = this.checkIfNeedFixCurvesRadiuses(newCoords);
      if (radiuses.length) {
        const body = 'При изменении данной длины будут увеличены радиус(ы) прилегающих выпуклых/вогнутых линий. Продолжить?';
        const title = 'Подтверждение';
        const confirmation = await confirmModal({ body, title });
        if (!confirmation) return;
      }
      if (radiuses.length) {
        radiuses.forEach((r) => {
          const { j, radius } = r;
          this.$store.dispatch('changeRadius', { i, j, radius });
        });
      }
      const insetsBulges = [];
      this.part.points.some((point, j) => {
        const index = newCoords.findIndex((p) => p.id === point.id);
        if (index >= 0) {
          if (['inset', 'bulge'].includes(point.subType)) {
            insetsBulges.push({
              insetBulgeId: point.insetBulgeId,
              fromPointId: point.id,
              x: newCoords[index].x - point.c[0],
              y: newCoords[index].y - point.c[1],
            });
          }
          this.$store.dispatch('changePoint', {
            i,
            j,
            point: newCoords.splice(index, 1)[0],
          });
        }
        return !newCoords.length;
      });
      if (insetsBulges.length) {
        insetsBulges.forEach((iB) => {
          const insetBulge = this.part.insetsBulges.find((ib) => ib.id === iB.insetBulgeId);
          insetBulge.pointsId.filter((id) => id !== iB.fromPointId).forEach((id) => {
            const index = this.part.points.findIndex((p) => p.id === id);
            const [x, y] = this.part.points[index].c;
            this.$store.dispatch('changePoint', {
              i,
              j: index,
              point: { x: x + iB.x, y: y + iB.y },
            });
          });
        });
      }
      this.$store.commit('addLog');
    },
    getLinearEquation() {
      // y = mx + n - формула линейного уравнения
      const pts = this.points;
      const m = (pts[1].y - pts[0].y) / (pts[1].x - pts[0].x);
      const n = -pts[0].x * m + pts[0].y;
      return { m, n };
    },
    checkIfNeedFixCurvesRadiuses(pts) {
      const radiuses = [];
      const { borders, points } = this.part;
      let curIndex = this.selectedEl.j;
      const prevIndex = curIndex > 0 ? curIndex - 1 : borders.length - 1;
      const prevBorder = borders[prevIndex];
      if (prevBorder.type === 'curveBorder') {
        const p1 = { x: points[prevIndex].c[0], y: points[prevIndex].c[1] };
        const p2 = pts.find((p) => p.id === points[curIndex].id);
        if (p2) {
          const minRadius = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2) / 2 + 2;
          if (prevBorder.radius < minRadius) radiuses.push({ j: prevIndex, radius: minRadius });
        }
      }
      curIndex = curIndex < borders.length - 1 ? curIndex + 1 : 0;
      const nextIndex = curIndex < borders.length - 1 ? curIndex + 1 : 0;
      const nextBorder = borders[curIndex];
      if (nextBorder.type === 'curveBorder') {
        const p1 = { x: points[nextIndex].c[0], y: points[nextIndex].c[1] };
        const p2 = pts.find((p) => p.id === points[curIndex].id);
        if (p2) {
          const minRadius = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2) / 2 + 2;
          if (nextBorder.radius < minRadius) radiuses.push({ j: curIndex, radius: minRadius });
        }
      }
      return radiuses;
    },
  },
};
</script>
