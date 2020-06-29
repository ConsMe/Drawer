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
    parts() { return this.$store.getters.parts; },
    selectedEl() { return this.$store.getters.selectedEl; },
    part() { return this.parts[this.selectedEl.i]; },
    element() { return this.selectedEl.el; },
    elementId() { return this.element.id; },
    points() {
      let pts = this.clone(this.element.points);
      const { pointsId } = this.element;
      pts = [
        { x: pts[0], y: pts[1], id: pointsId[0] },
        { x: pts[2], y: pts[3], id: pointsId[1] },
      ].sort((p1, p2) => p1.x - p2.x);
      if (pts[0].x === pts[1].x) pts = pts.sort((p1, p2) => p1.y - p2.y);
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
      const radiuses = this.checkIfNeedFixCurvesRadiuses(newCoords, i);
      if (radiuses.length) {
        const body = 'При изменении данной длины будут увеличены радиус(ы) прилегающих выпуклых/вогнутых линий. Продолжить?';
        const confirmation = await confirmModal({ body });
        if (!confirmation) return;
      }
      if (radiuses.length) {
        radiuses.forEach((r) => {
          const { j, radius } = r;
          this.$store.dispatch('changeRadius', { i, j, radius });
        });
      }
      const insetsBulges = [];
      this.parts[i].points.some((point, j) => {
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
    },
    getLinearEquation() {
      // y = mx + n - формула линейного уравнения
      const pts = this.points;
      const m = (pts[1].y - pts[0].y) / (pts[1].x - pts[0].x);
      const n = -pts[0].x * m + pts[0].y;
      return { m, n };
    },
    checkIfNeedFixCurvesRadiuses(pts, i) {
      const ids = pts.map((p) => p.id);
      const radiuses = [];
      this.parts[i].borders.some((border, j) => {
        if (border.type !== 'curveBorder') return false;
        const pointIdIndex = border.pointsId.findIndex((id) => ids.includes(id));
        if (pointIdIndex < 0) return false;
        const p1 = pts.find((p) => p.id === border.pointsId[pointIdIndex]);
        const p2 = pointIdIndex === 0
          ? { x: border.points[2], y: border.points[3] }
          : { x: border.points[0], y: border.points[1] };
        const minRadius = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2) / 2 + 2;
        if (border.radius >= minRadius) return false;
        radiuses.push({ j, radius: minRadius });
        return true;
      });
      return radiuses;
    },
  },
};
</script>
