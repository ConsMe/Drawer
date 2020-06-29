<template>
  <div
    class="btn-group ml-3"
    role="group"
    title="За счет какой стороны менять длину">
    <button
      type="button"
      @click="choosed = 1"
      :class="[`btn${choosed === 1 ? '' : '-outline'}-secondary`]"
      class="btn">
      <font-awesome-icon icon="long-arrow-alt-right" :style="angleStyle" />
    </button>
    <button
      type="button"
      @click="choosed = 0"
      :class="[`btn${!choosed ? '' : '-outline'}-secondary`]"
      class="btn">
      <font-awesome-icon icon="long-arrow-alt-left" :style="angleStyle" />
    </button>
    <button
      type="button"
      @click="choosed = 'both'"
      :class="[`btn${choosed === 'both' ? '' : '-outline'}-secondary`]"
      class="btn">
      <font-awesome-icon icon="arrows-alt-h" :style="angleStyle" />
    </button>
  </div>
</template>

<script>
export default {
  props: ['element', 'points'],
  data() {
    return {
      choosed: 1,
    };
  },
  computed: {
    angleStyle() {
      if (!this.points) return null;
      const { points } = this;
      const p1 = points[0];
      const p2 = points[1];
      const length = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
      const cos = (p2.x - p1.x) / length;
      let angle = Math.acos(cos) * (180 / Math.PI);
      angle = p2.y > p1.y ? angle : -angle;
      return {
        transform: `rotate(${angle}deg)`,
      };
    },
  },
  watch: {
    choosed: {
      handler(choosed) {
        // const pts = this.points;
        // const changePointId = typeof choosed === 'string'
        // ? [pts[0].id, pts[1].id] : pts[choosed];
        this.$emit('setChoosedPoint', choosed);
      },
      immediate: true,
    },
  },
};
</script>
