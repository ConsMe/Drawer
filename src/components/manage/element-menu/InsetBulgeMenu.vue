<template>
  <div>
    <form @submit.prevent="setParams">
      <div class="form-group row no-gutters">
        <label class="col-auto col-form-label text-left">Внешняя длина</label>
        <div class="col-auto px-1">
          <input type="text" class="form-control" v-model="outLengthInMm">
        </div>
        <span class="col-auto d-flex align-items-center">мм</span>
      </div>
      <div class="form-group row no-gutters">
        <label class="col-auto col-form-label text-left">Внутренняя длина</label>
        <div class="col-auto px-1">
          <input type="text" class="form-control" v-model="inLengthInMm">
        </div>
        <span class="col-auto d-flex align-items-center">мм</span>
      </div>
      <div class="form-group row no-gutters">
        <label class="col-auto col-form-label text-left">Глубина</label>
        <div class="col-auto px-1">
          <input type="text" class="form-control" v-model="depthInMm">
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
    // outLengthInMm(l) { this.inLengthInMm = l; },
    // inLengthInMm(l) { this.outLengthInMm = l; },
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
  },
};
</script>
