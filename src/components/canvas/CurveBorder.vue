<template>
  <div>
    <v-arc
      :config="{
        ...config,
        stroke,
      }"
      ref="border"
      @contextmenu="setContextMenuEvent($event, config.allBordersIndex)"
      @mouseover="$store.commit('setCurrentEl', border.id)"
      @mouseleave="$store.commit('setCurrentEl', null)"
      @click="$store.commit('setSelectedElId', border.id)" />
    <edge-tag
      v-if="border.edgeTag && border.edgeTag.isShown"
      :border="border"
      :borderConfig="config"
      :partIndex="partIndex"
      :part="part" />
    <radius-tag
      v-if="border.radiusTag && border.radiusTag.isShown"
      :border="border"
      :borderConfig="config"
      :partIndex="partIndex"
      :part="part" />
  </div>
</template>

<script>
// import Victor from 'victor';
import EdgeTag from './EdgeTag.vue';
import RadiusTag from './RadiusTag.vue';

export default {
  props: ['partIndex', 'curves', 'borderIndex'],
  components: {
    EdgeTag, RadiusTag,
  },
  computed: {
    selectedElId() { return this.$store.state.selectedElId; },
    currentElId() { return this.$store.state.currentElId; },
    pxPerMm() { return this.$store.state.pxPerMm; },
    part() { return this.$store.state.parts.partsInit[this.partIndex]; },
    border() { return this.part.borders[this.borderIndex]; },
    partPosition() { return this.part.position; },
    selectedColor() { return this.$store.state.selectedColor; },
    points() {
      const p1 = this.$store.state.parts.partsInit[this.partIndex]
        .points.find((p) => p.id === this.border.pointsId[0]).c;
      const p2 = this.$store.state.parts.partsInit[this.partIndex]
        .points.find((p) => p.id === this.border.pointsId[1]).c;
      return [...p1, ...p2];
    },
    lineJoin() {
      const prev = this.borderIndex ? this.part.borders[this.borderIndex - 1]
        : this.part.borders[this.part.borders.length - 1];
      const next = this.borderIndex < this.part.borders.length - 1
        ? this.part.borders[this.borderIndex + 1] : this.part.borders[0];
      return prev.skirting && next.skirting ? 'round' : 'miter';
    },
    stroke() {
      return [this.currentElId, this.selectedElId].includes(this.border.id)
        || this.selectedElId === this.part.id ? this.selectedColor : 'black';
    },
    config() {
      this.console.log('curveBorder', this.border.id);
      const { type, id, isInside } = this.border;
      const { skirting } = this.border;
      const c = { ...this.curves[id] };
      return {
        type,
        id,
        points: this.points.map((p) => p * this.pxPerMm),
        isInside,
        strokeWidth: skirting ? 4 : 1,
        lineJoin: this.lineJoin,
        hitStrokeWidth: 5,
        allBordersIndex: this.borderIndex,
        innerRadius: c.R,
        outerRadius: c.R,
        x: c.c1.x,
        y: c.c1.y,
        angle: c.ang2 * (180 / Math.PI) - c.ang1 * (180 / Math.PI),
        rotation: c.ang1 * (180 / Math.PI),
        clockwise: c.isInside,
      };
    },
  },
  methods: {
    setContextMenuEvent(e, index) {
      const { partIndex } = this;
      this.$store.commit('setContextMenuEvent', { e, partIndex, borderIndex: index });
    },
  },
};
</script>
