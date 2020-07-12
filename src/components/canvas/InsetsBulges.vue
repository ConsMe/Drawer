<template>
  <div>
    <v-line
      v-for="(iB, i) in insetsBulges"
      :key="iB.id"
      :config="{
        ...configs[i],
        strokeWidth: [currentElId, selectedElId].includes(iB.id) ? 2 : 0,
      }"
      @mouseover="$store.commit('setCurrentEl', iB.id)"
      @mouseleave="$store.commit('setCurrentEl', null)"
      @click="$store.commit('setSelectedElId', iB.id)"
      @contextmenu="setContextMenuEvent($event, i)" />
  </div>
</template>

<script>
export default {
  props: ['part', 'partIndex'],
  computed: {
    insetsBulges() { return this.part.insetsBulges; },
    pxPerMm() { return this.$store.state.pxPerMm; },
    dash() { return [this.pxPerMm * 30, this.pxPerMm * 15]; },
    selectedColor() { return this.$store.state.selectedColor; },
    configs() {
      return this.insetsBulges.map((iB) => ({
        id: iB.id,
        points: iB.pointsInPx,
        closed: true,
        dash: this.dash,
        stroke: this.selectedColor,
        type: iB.type,
      }));
    },
    selectedElId() { return this.$store.state.selectedElId; },
    currentElId() { return this.$store.state.currentElId; },
    contextMenuAction() { return this.$store.state.contextMenuAction; },
  },
  watch: {
    contextMenuAction(data) {
      if (data.partIndex !== this.partIndex) return;
      if (data.action === 'deleteInsetBulge') {
        this.deleteInsetBulge(data);
      }
    },
  },
  methods: {
    setContextMenuEvent(e, index) {
      const { partIndex } = this;
      this.$store.commit('setContextMenuEvent', { e, partIndex, insetBulgeIndex: index });
    },
    deleteInsetBulge(data) {
      const { pointsId } = this.insetsBulges[data.insetBulgeIndex];
      const { partIndex } = this;
      this.$store.commit('setSelectedElId', null);
      const pointIndex = this.part.points.findIndex((p) => pointsId.includes(p.id));
      new Array(4).fill('').forEach(() => {
        this.$store.commit('deletePoint', { partIndex, pointIndex });
      });
    },
  },
};
</script>
