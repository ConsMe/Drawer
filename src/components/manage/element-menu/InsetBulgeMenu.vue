<template>
  <div>
    <form @submit.prevent="setParams">
      <div class="form-group row no-gutters">
        <label class="col-auto col-form-label text-left">Внешняя длина</label>
        <div class="col-auto px-1">
          <input type="number" class="form-control" v-model="outLengthInMm">
        </div>
        <span class="col-auto d-flex align-items-center">мм</span>
      </div>
      <div class="form-group row no-gutters">
        <label class="col-auto col-form-label text-left">Внутренняя длина</label>
        <div class="col-auto px-1">
          <input type="number" class="form-control" v-model="inLengthInMm">
        </div>
        <span class="col-auto d-flex align-items-center">мм</span>
      </div>
      <div class="form-group row no-gutters">
        <label class="col-auto col-form-label text-left">Глубина</label>
        <div class="col-auto px-1">
          <input type="number" class="form-control" v-model="depthInMm">
        </div>
        <span class="col-auto d-flex align-items-center">мм</span>
      </div>
      <div class="form-group row no-gutters">
        <label class="col-auto col-form-label text-left">Отступ 1</label>
        <div class="col-auto px-1">
          <input type="number" class="form-control" v-model="marginInMm1">
        </div>
        <span class="col-auto d-flex align-items-center">мм</span>
      </div>
      <div class="form-group row no-gutters">
        <label class="col-auto col-form-label text-left">Отступ 2</label>
        <div class="col-auto px-1">
          <input type="number" class="form-control" v-model="marginInMm2">
        </div>
        <span class="col-auto d-flex align-items-center">мм</span>
      </div>
      <div class="form-group row no-gutters">
        <div class="col-auto text-left">
          <button type="submit" class="btn btn-primary">Установить</button>
        </div>
      </div>
    </form>
  </div>
</template>

<script>
import Victor from 'victor';

export default {
  data() {
    return {
      outLengthInMm: 0,
      inLengthInMm: 0,
      depthInMm: 0,
      marginInMm1: 0,
      marginInMm2: 0,
    };
  },
  computed: {
    selectedEl() { return this.$store.getters.selectedEl; },
    part() { return this.$store.state.parts.partsInit[this.selectedEl.i]; },
    element() { return this.selectedEl.el; },
    points() {
      const points = this.element.pointsId.map((id) => {
        const point = this.part.points.find((p) => p.id === id);
        return { id, c: point.c };
      });
      return {
        out: this.element.type === 'inset' ? [points[0], points[3]] : [points[1], points[2]],
        in: this.element.type === 'inset' ? [points[1], points[2]] : [points[0], points[3]],
      };
    },
    currentOutLength() {
      const pts = this.points.out.map((p) => p.c);
      return Math.sqrt((pts[1][0] - pts[0][0]) ** 2 + (pts[1][1] - pts[0][1]) ** 2);
    },
    currentInLength() {
      const pts = this.points.in.map((p) => p.c);
      return Math.sqrt((pts[1][0] - pts[0][0]) ** 2 + (pts[1][1] - pts[0][1]) ** 2);
    },
    currentMargin1() {
      const prevIndex = this.element.pointsIndexes[0] > 0
        ? this.element.pointsIndexes[0] - 1 : this.part.points.length - 1;
      const p1 = this.part.points[prevIndex].c;
      const p2 = this.part.points[this.element.pointsIndexes[0]].c;
      const vec = new Victor(p2[0] - p1[0], p2[1] - p1[1]);
      return vec.length();
    },
    currentMargin2() {
      const nextIndex = this.element.pointsIndexes[3] < this.part.points.length - 1
        ? this.element.pointsIndexes[3] + 1 : 0;
      const p1 = this.part.points[this.element.pointsIndexes[3]].c;
      const p2 = this.part.points[nextIndex].c;
      const vec = new Victor(p2[0] - p1[0], p2[1] - p1[1]);
      return vec.length();
    },
  },
  watch: {
    points: {
      handler() {
        this.outLengthInMm = Math.round(this.currentOutLength);
        this.inLengthInMm = Math.round(this.currentInLength);
        this.depthInMm = this.element.depth;
      },
      immediate: true,
    },
    currentMargin1: {
      handler() { this.marginInMm1 = Math.round(this.currentMargin1); },
      immediate: true,
    },
    currentMargin2: {
      handler() { this.marginInMm2 = Math.round(this.currentMargin2); },
      immediate: true,
    },
  },
  methods: {
    setParams() {
      if (Math.round(this.outLengthInMm) !== Math.round(this.currentOutLength)) {
        this.setPoints(this.points.out, this.outLengthInMm, this.currentOutLength);
      }
      if (Math.round(this.inLengthInMm) !== Math.round(this.currentInLength)) {
        this.setPoints(this.points.in, this.inLengthInMm, this.currentInLength);
      }
      if (Math.round(this.depthInMm) !== Math.round(this.element.depth)) {
        const depthPoints = this.points[this.element.type === 'inset' ? 'in' : 'out'];
        this.setDepth(depthPoints, this.depthInMm, this.element.depth);
      }
      if (Math.round(this.marginInMm1) !== Math.round(this.currentMargin1)) {
        this.setMargin1();
      } else if (Math.round(this.marginInMm2) !== Math.round(this.currentMargin2)) {
        this.setMargin2();
      }
      this.$store.commit('addLog');
    },
    setPoints(pts, newLength, currentLength) {
      let startVec = new Victor(pts[0].c[0], pts[0].c[1]);
      let vec = new Victor(pts[1].c[0] - pts[0].c[0], pts[1].c[1] - pts[0].c[1]);
      const diffLength = Math.abs(newLength - currentLength) / 2;
      const angle = newLength > currentLength ? 180 : 0;
      vec = vec.norm().rotateDeg(angle).multiply(new Victor(diffLength, diffLength));
      startVec = vec.clone().add(startVec);
      this.setPoint({ id: pts[0].id, c: startVec.toObject() });
      vec = vec.norm().rotateDeg(angle).multiply(new Victor(newLength, newLength));
      startVec = vec.clone().add(startVec);
      this.setPoint({ id: pts[1].id, c: startVec.toObject() });
    },
    setPoint(point) {
      const payload = {
        i: this.selectedEl.i,
        j: this.part.points.findIndex((p) => p.id === point.id),
        point: point.c,
      };
      this.$store.dispatch('changePoint', payload);
    },
    setDepth(pts, newDepth, currentDepth) {
      let startVec = new Victor(pts[0].c[0], pts[0].c[1]);
      let vec = new Victor(pts[1].c[0] - pts[0].c[0], pts[1].c[1] - pts[0].c[1]);
      const length = vec.length();
      const diffDepth = Math.abs(newDepth - currentDepth);
      const k = (newDepth > currentDepth && this.element.type === 'inset')
        || (newDepth < currentDepth && this.element.type === 'bulge') ? 1 : -1;
      vec = vec.norm().rotateDeg(90 * k).multiply(new Victor(diffDepth, diffDepth));
      startVec = vec.clone().add(startVec);
      this.setPoint({ id: pts[0].id, c: startVec.toObject() });
      vec = vec.norm().rotateDeg(-90 * k).multiply(new Victor(length, length));
      startVec = vec.clone().add(startVec);
      this.setPoint({ id: pts[1].id, c: startVec.toObject() });
      const { i, j } = this.selectedEl;
      this.$store.commit('setInsetBulgeDepth', { i, j, depth: newDepth });
    },
    setMargin1() {
      const prevIndex = this.element.pointsIndexes[0] > 0
        ? this.element.pointsIndexes[0] - 1 : this.part.points.length - 1;
      const p1 = this.part.points[prevIndex].c;
      const p2 = this.part.points[this.element.pointsIndexes[0]].c;
      const vec = new Victor(p2[0] - p1[0], p2[1] - p1[1]);
      const startVec = new Victor(p1[0], p1[1]);
      const newCoords = vec.clone().norm()
        .multiply(new Victor(this.marginInMm1, this.marginInMm1)).add(startVec)
        .toArray();
      const diff = { x: newCoords[0] - p2[0], y: newCoords[1] - p2[1] };
      this.element.pointsIndexes.forEach((index) => {
        this.$store.dispatch('changePoint', {
          i: this.selectedEl.i,
          j: index,
          point: {
            x: this.part.points[index].c[0] + diff.x,
            y: this.part.points[index].c[1] + diff.y,
          },
        });
      });
    },
    setMargin2() {
      const nextIndex = this.element.pointsIndexes[3] < this.part.points.length - 1
        ? this.element.pointsIndexes[3] + 1 : 0;
      const p1 = this.part.points[nextIndex].c;
      const p2 = this.part.points[this.element.pointsIndexes[3]].c;
      const vec = new Victor(p2[0] - p1[0], p2[1] - p1[1]);
      const startVec = new Victor(p1[0], p1[1]);
      const newCoords = vec.clone().norm()
        .multiply(new Victor(this.marginInMm2, this.marginInMm2)).add(startVec)
        .toArray();
      const diff = { x: newCoords[0] - p2[0], y: newCoords[1] - p2[1] };
      this.element.pointsIndexes.forEach((index) => {
        this.$store.dispatch('changePoint', {
          i: this.selectedEl.i,
          j: index,
          point: {
            x: this.part.points[index].c[0] + diff.x,
            y: this.part.points[index].c[1] + diff.y,
          },
        });
      });
    },
  },
};
</script>
