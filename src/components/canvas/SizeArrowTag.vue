<template>
  <v-group v-if="border.border.sizeArrow !== 'off'">
    <v-arrow :config="{
      points: params.arrowPoints,
      stroke: 'black',
      fill: 'black',
      pointerAtBeginning: true,
      strokeWidth: 1,
      pointerLength : 5,
      pointerWidth : 5,
    }" />
    <v-label :config="{
        ...params.textPosition,
        rotation: params.angle,
        offset: params.offset,
      }"
      @mouseover="over = true"
      @mouseleave="over = false"
      @contextmenu="setContextMenuEvent">
      <v-tag :config="{fill: 'white'}" />
      <v-text :config="{
        text: params.lengthText,
        padding: params.padding,
        fontSize,
        fontFamily: 'Calibri',
        fill: over ? 'red' : 'black',
        type: 'sizeArrow',
      }" />
    </v-label>
  </v-group>
</template>

<script>
import Victor from 'victor';

export default {
  props: ['border', 'partIndex'],
  data() {
    return {
      over: false,
    };
  },
  computed: {
    offsetInMm() { return this.border.border.skirting ? 70 : 50; },
    pxPerMm() { return this.$store.state.pxPerMm; },
    fontSize() { return this.$store.state.fontSizeInmM.sizeArrow * this.pxPerMm; },
    params() {
      const { points } = this.border.config;
      const insideK = this.border.border.sizeArrow === 'inside' ? -1 : 1;
      let startVec = new Victor(points[0], points[1]);
      let vec = new Victor(points[2] - points[0], points[3] - points[1]);
      const length = vec.length();
      let angle = vec.angleDeg();
      angle = angle < 0 ? angle + 360 : angle;
      const halfFontSize = this.fontSize / 2;
      const lengthText = Math.round(length / this.pxPerMm).toString();
      const offset = {
        x: halfFontSize * lengthText.length,
        y: halfFontSize,
      };
      const textOffset = length * 0.5 + offset.x / 2;
      const offsetInPx = this.offsetInMm * this.pxPerMm;
      vec = vec.norm().rotateDeg(-90 * insideK).multiply(new Victor(offsetInPx, offsetInPx));
      startVec = vec.clone().add(startVec);
      const p1 = startVec.toArray();
      const textVec = vec.clone().norm().rotateDeg(90 * insideK)
        .multiply(new Victor(textOffset, textOffset));
      const textPosition = textVec.add(startVec).toObject();
      vec = vec.norm().rotateDeg(90 * insideK).multiply(new Victor(length, length));
      startVec = vec.clone().add(startVec);
      const p2 = startVec.toArray();
      return {
        arrowPoints: [...p1, ...p2],
        textPosition,
        lengthText,
        padding: 0,
        angle,
        offset,
      };
    },
    contextMenuAction() { return this.$store.state.contextMenuAction; },
  },
  watch: {
    contextMenuAction(data) {
      if (data.partIndex !== this.partIndex) return;
      if (data.borderIndex !== this.border.config.allBordersIndex) return;
      if (['showInsideOutside', 'hide', 'showSizeArrow'].includes(data.action)) {
        let sizeArrow;
        if (data.action === 'hide') {
          sizeArrow = 'off';
        } else if (data.action === 'showSizeArrow') {
          sizeArrow = 'outside';
        } else {
          sizeArrow = this.border.border.sizeArrow === 'inside' ? 'outside' : 'inside';
        }
        this.$store.commit('changeSizeArrow', {
          i: data.partIndex,
          j: data.borderIndex,
          sizeArrow,
        });
      }
    },
  },
  methods: {
    setContextMenuEvent(e) {
      const { partIndex } = this;
      this.$store.commit('setContextMenuEvent', {
        e,
        partIndex,
        borderIndex: this.border.config.allBordersIndex,
      });
    },
  },
};
</script>
