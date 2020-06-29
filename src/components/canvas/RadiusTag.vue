<template>
  <v-label
    v-if="border.border.radiusPosition !== 'off'"
    :config="{
      ...params.textPosition,
      rotation: params.angle,
      offset: params.offset,
    }"
    @mouseover="over = true"
    @mouseleave="over = false"
    @contextmenu="setContextMenuEvent">
    <v-tag :config="{fill: 'white'}" />
    <v-text :config="{
      text: params.radiusText,
      padding: params.padding,
      fontSize,
      fontFamily: 'Calibri',
      fill: over ? 'red' : 'black',
      type: 'radius',
    }" />
  </v-label>
</template>

<script>
import Victor from 'victor';

export default {
  props: ['border', 'partIndex'],
  data() {
    return {
      over: false,
      offsetInMm: 100,
    };
  },
  computed: {
    pxPerMm() { return this.$store.state.pxPerMm; },
    fontSize() { return this.$store.state.fontSizeInmM.radius * this.pxPerMm; },
    params() {
      const { x, y } = this.border.config;
      const pts = this.border.config.points;
      let startVec = new Victor(pts[0], pts[1]);
      let vec = new Victor(pts[2] - pts[0], pts[3] - pts[1]);
      let angle = vec.angleDeg();
      angle = angle < 0 ? angle + 360 : angle;
      const halfLength = vec.length() / 2;
      vec = vec.norm().multiply(new Victor(halfLength, halfLength));
      const halfPoint = vec.clone().add(startVec);
      startVec = new Victor(x, y);
      vec = new Victor(halfPoint.x - x, halfPoint.y - y);
      let isInsideK = this.border.border.isInside ? 1 : -1;
      isInsideK = this.border.border.radiusPosition === 'opposite' ? -isInsideK : isInsideK;
      const textDistance = this.border.config.innerRadius
        - this.offsetInMm * this.pxPerMm * isInsideK;
      vec = vec.norm().multiply(new Victor(textDistance, textDistance));
      const textPosition = vec.clone().add(startVec).toObject();
      const halfFontSize = this.fontSize / 2;
      const radiusText = `R ${Math.round(this.border.border.radius)}`;
      const offset = {
        x: (halfFontSize * radiusText.length) / 2,
        y: halfFontSize,
      };
      return {
        padding: 0,
        textPosition,
        angle,
        offset,
        radiusText,
      };
    },
    contextMenuAction() { return this.$store.state.contextMenuAction; },
  },
  watch: {
    contextMenuAction(data) {
      if (data.partIndex !== this.partIndex) return;
      if (data.borderIndex !== this.border.config.allBordersIndex) return;
      if (['showRadiusOpposite', 'hide', 'showRadius'].includes(data.action)) {
        let radiusPosition;
        if (data.action === 'hide') {
          radiusPosition = 'off';
        } else if (data.action === 'showRadius') {
          radiusPosition = 'usual';
        } else {
          radiusPosition = this.border.border.radiusPosition === 'usual' ? 'opposite' : 'usual';
        }
        this.$store.commit('changeRadiusPosition', {
          i: data.partIndex,
          j: data.borderIndex,
          radiusPosition,
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
