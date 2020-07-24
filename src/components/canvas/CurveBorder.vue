<template>
  <div>
    <v-arc
      :config="{
        ...config,
        stroke: [currentElId, selectedElId].includes(border.id) || selectedElId === part.id
          ? selectedColor : 'black',
      }"
      ref="border"
      @contextmenu="setContextMenuEvent($event, config.allBordersIndex)"
      @mouseover="$store.commit('setCurrentEl', border.id)"
      @mouseleave="$store.commit('setCurrentEl', null)"
      @click="$store.commit('setSelectedElId', border.id)" />
    <edge
      v-if="border.edgeTag.isShown"
      :border="{ border, config }"
      :partIndex="partIndex"
      :part="part" />
    <radius-tag
      v-if="border.radiusTag.isShown"
      :border="{ border, config }"
      :partIndex="partIndex"
      :part="part" />
  </div>
</template>

<script>
// import Victor from 'victor';
import Edge from './Edge.vue';
import RadiusTag from './RadiusTag.vue';

export default {
  props: ['border', 'part', 'partIndex', 'curves'],
  components: {
    Edge, RadiusTag,
  },
  computed: {
    selectedElId() { return this.$store.state.selectedElId; },
    currentElId() { return this.$store.state.currentElId; },
    pxPerMm() { return this.$store.state.pxPerMm; },
    partPosition() { return this.part.position; },
    selectedColor() { return this.$store.state.selectedColor; },
    config() {
      const { border } = this;
      const prev = border.allBordersIndex ? this.part.borders[border.allBordersIndex - 1]
        : this.part.borders[this.part.borders.length - 1];
      const next = border.allBordersIndex < this.part.borders.length - 1
        ? this.part.borders[border.allBordersIndex + 1] : this.part.borders[0];
      const { type, id, points } = border;
      const c = { ...this.curves[border.id] };
      return {
        type,
        id,
        points: points.map((p) => p * this.pxPerMm),
        isInside: border.isInside,
        strokeWidth: border.skirting ? 4 : 1,
        lineJoin: prev.skirting && next.skirting ? 'round' : 'miter',
        hitStrokeWidth: 5,
        allBordersIndex: border.allBordersIndex,
        innerRadius: c.R,
        outerRadius: c.R,
        x: c.c1.x,
        y: c.c1.y,
        angle: c.ang2 * (180 / Math.PI) - c.ang1 * (180 / Math.PI),
        rotation: c.ang1 * (180 / Math.PI),
        clockwise: c.isInside,
        radiusTag: border.radiusTag,
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
