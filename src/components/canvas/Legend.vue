<template>
  <div>
    <v-group
      :config="{
        x: legend.x * this.pxPerMm,
        y: legend.y * this.pxPerMm,
        draggable: true,
        dragBoundFunc(pos) {
          const x = Math.round(pos.x / 10) * 10;
          const y = Math.round(pos.y / 10) * 10;
          return { x, y };
        },
      }"
      @dragend="dragend">
      <v-image
        v-if="legend.subType.indexOf('edge') === 0"
        :config="{
          image: $store.state.files.edges[legend.subType.split('_')[1]],
          width: sizeInPx,
          height: sizeInPx,
          offset: { x: sizeInPx * 1.5, y: sizeInPx / 6 },
        }" />
      <v-rect
        v-else-if="legend.subType === 'skirting'"
        :config="{
          width: sizeInPx,
          fill: 'black',
          height: sizeInPx / 5,
          offset: { x: sizeInPx * 1.5, y: -sizeInPx / 6 },
        }" />
      <v-rect
        v-else-if="['color', 'noBg'].includes(legend.subType)"
        :config="{
          width: sizeInPx,
          stroke: 'black',
          strokeWidth: 1,
          fill: legend.subType === 'color' ? 'rgb(200,200,200)' : 'white',
          height: sizeInPx,
          offset: { x: sizeInPx * 1.5, y: sizeInPx / 6 },
        }" />
      <v-rect
        v-else
        :config="{
          width: sizeInPx,
          stroke: 'black',
          strokeWidth: 1,
          fill: 'white',
          fillPatternImage: fills({ type: legend.subType, color: 'rgb(150,150,150)' }),
          fillPriority: 'pattern',
          height: sizeInPx,
          offset: { x: sizeInPx * 1.5, y: sizeInPx / 6 },
        }" />
      <v-text
        :config="{
          type: 'legend',
          id: legend.id,
          text: legend.text,
          fontFamily: 'Calibri',
          fontSize,
          fill: [currentElId, selectedElId].includes(legend.id)
            ? selectedColor : 'black',
          visible: !(selectedElId === legend.id && isTextEditMode)
        }"
        @mouseover="over = true"
        @mouseleave="over = false"
        @click="$store.commit('setSelectedElId', legend.id)"
        @dblclick="editText"
        @contextmenu="setContextMenuEvent" />
    </v-group>
  </div>
</template>

<script>
import fills from '../../modules/fills';

export default {
  props: ['legend', 'legendIndex'],
  data() {
    return {
      over: false,
      sizeInMm: 120,
      fills,
    };
  },
  computed: {
    selectedColor() { return this.$store.state.selectedColor; },
    selectedElId() { return this.$store.state.selectedElId; },
    currentElId() { return this.$store.state.currentElId; },
    pxPerMm() { return this.$store.state.pxPerMm; },
    fontSize() {
      return this.$store.state.fontSizeInmM.text * this.pxPerMm * this.legend.sizeK;
    },
    isTextEditMode() { return this.$store.state.isTextEditMode; },
    contextMenuAction() { return this.$store.state.contextMenuAction; },
    sizeInPx() { return this.sizeInMm * this.pxPerMm * this.legend.sizeK; },
  },
  watch: {
    over(over) {
      if (over) {
        this.$store.commit('setCursor', 'move');
        this.$store.commit('setCurrentEl', this.legend.id);
      } else {
        this.$store.commit('resetCursor');
        this.$store.commit('setCurrentEl', null);
      }
    },
    contextMenuAction(data) {
      if (data.legendIndex !== this.legendIndex) return;
      if (data.action === 'deleteLegend') {
        setTimeout(() => {
          this.$store.commit('deleteLegend', { i: data.legendIndex });
          this.$store.commit('addLog');
        }, 0);
      }
    },
    // legend: {
    //   handler() {
    //     console.log('legend');
    //   },
    //   deep: true,
    // },
  },
  methods: {
    dragend(e) {
      const pos = e.target.getPosition();
      pos.x /= this.pxPerMm;
      pos.y /= this.pxPerMm;
      this.$store.commit('setLegendParams', { ...this.legend, ...pos, i: this.legendIndex });
      this.$store.commit('addLog');
    },
    editText() {
      this.$store.commit('setTextEditMode', true);
    },
    setContextMenuEvent(e) {
      const { legendIndex } = this;
      this.$store.commit('setContextMenuEvent', { e, legendIndex });
    },
  },
};
</script>
