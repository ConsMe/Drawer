<template>
  <div class="d-inline-block w-auto">
    <input type="text" v-model.number="width" >
    X
    <input type="text" v-model.number="height" >
    <button class="btn btn-secondary ml-2" type="button" @click="add">
      Элемент
    </button>
  </div>
</template>

<script>
import getId from '../../../mixins/getId';

export default {
  mixins: [getId],
  data() {
    return {
      els: [],
      width: 1000,
      height: 2000,
    };
  },
  computed: {
    pxPerMm() { return this.$store.state.pxPerMm; },
    canvasWidthInMm() { return this.$store.state.canvasWidthInMm; },
    canvasHeightInMm() { return this.$store.state.canvasHeightInMm; },
  },
  methods: {
    add() {
      const widthInMm = this.width;
      const heightInMm = this.height;
      const startPoint = [
        (this.canvasWidthInMm - widthInMm) / 2,
        (this.canvasHeightInMm - heightInMm) / 2,
      ];
      const part = {
        id: this.getId(),
        position: { x: 0, y: 0 },
        type: 'part',
        fill: null,
        points: [
          { id: this.getId(), c: startPoint },
          { id: this.getId(), c: [startPoint[0] + widthInMm, startPoint[1]] },
          { id: this.getId(), c: [startPoint[0] + widthInMm, startPoint[1] + heightInMm] },
          { id: this.getId(), c: [startPoint[0], startPoint[1] + heightInMm] },
        ],
      };
      part.borders = part.points.map(() => (
        {
          id: this.getId(),
          type: 'lineBorder',
          sizeTag: { isShown: true },
          radiusPosition: 'usual',
        }
      ));
      this.$store.commit('addPart', part);
      this.$store.commit('addLog');
    },
  },
};
</script>
