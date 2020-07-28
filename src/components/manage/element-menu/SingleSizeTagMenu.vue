<template>
  <div>
    <form @submit.prevent="setTagLength">
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
      </div>
    </form>
  </div>
</template>

<script>
import Victor from 'victor';

export default {
  data() {
    return {
      lengthInMm: 0,
    };
  },
  computed: {
    selectedEl() { return this.$store.getters.selectedEl; },
    part() { return this.$store.state.parts.partsInit[this.selectedEl.i]; },
    element() { return this.selectedEl.el; },
    elementId() { return this.element.id; },
    pxPerMm() { return this.$store.state.pxPerMm; },
    currentLengthInMm() {
      const pts = this.element.points;
      const vec = new Victor(pts[2] - pts[0], pts[3] - pts[1]);
      return Math.round(vec.length() + 6 / this.pxPerMm);
    },
  },
  watch: {
    currentLengthInMm: {
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
    setTagLength() {
      const pts = this.element.points;
      const startVec = new Victor(pts[0], pts[1]);
      const vec = new Victor(pts[2] - pts[0], pts[3] - pts[1]);
      const length = this.lengthInMm - 6 / this.pxPerMm;
      const newPts = vec.norm().multiply(new Victor(length, length))
        .add(startVec).toArray();
      const { i, j } = this.selectedEl;
      this.$store.commit('setSingleSizeTagParams', {
        i,
        j,
        points: [pts[0], pts[1], newPts[0], newPts[1]],
      });
      this.$store.commit('addLog');
    },
  },
};
</script>
