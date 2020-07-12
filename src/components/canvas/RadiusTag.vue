<template>
  <v-label
    v-if="border.border.radiusTag.isShown"
    ref="label"
    :config="{
      ...params.textPosition,
      rotation: params.angle,
      offset: params.offset,
      draggable: true,
      dragBoundFunc: params.dragBoundFunc,
    }"
    @mouseover="over = true"
    @mouseleave="over = false"
    @contextmenu="setContextMenuEvent"
    @dragend="dragend">
    <v-tag :config="{fill: 'white'}" />
    <v-text :config="{
      text: params.radiusText,
      padding: params.padding,
      fontSize,
      fontFamily: 'Calibri',
      fill: over ? selectedColor : 'black',
      type: 'radius',
    }" />
  </v-label>
</template>

<script>
import Victor from 'victor';

export default {
  props: ['border', 'partIndex', 'part'],
  data() {
    return {
      over: false,
      offsetInMm: 100,
      correctAngle: 0,
      correctDistance: 0,
    };
  },
  computed: {
    pxPerMm() { return this.$store.state.pxPerMm; },
    fontSize() { return this.$store.state.fontSizeInmM.radius * this.pxPerMm; },
    params() {
      const { x, y } = this.border.config;
      const correctAngle = this.border.border.radiusTag.correctAngle || 0;
      const correctDistance = this.border.border.radiusTag.correctDistance || 0;
      const pts = this.border.config.points;
      let startVec = new Victor(pts[0], pts[1]);
      let vec = new Victor(pts[2] - pts[0], pts[3] - pts[1]);
      let originalAngle = vec.angleDeg();
      originalAngle = originalAngle < 0 ? originalAngle + 360 : originalAngle;
      const angle = originalAngle + correctAngle;
      const halfLength = vec.length() / 2;
      vec = vec.norm().multiply(new Victor(halfLength, halfLength));
      const halfPoint = vec.clone().add(startVec);
      startVec = new Victor(x, y);
      vec = new Victor(halfPoint.x - x, halfPoint.y - y);
      const centerAngle = vec.angleDeg();
      const isInsideK = this.border.border.isInside ? 1 : -1;
      const originalDistance = this.border.config.innerRadius
        - this.offsetInMm * this.pxPerMm * isInsideK;
      const textDistance = originalDistance + correctDistance * this.pxPerMm;
      vec = vec.norm().rotateDeg(correctAngle).multiply(new Victor(textDistance, textDistance));
      const textPosition = vec.clone().add(startVec).toObject();
      const halfFontSize = this.fontSize / 2;
      const radiusText = `R ${Math.round(this.border.border.radius)}`;
      const offset = {
        x: (halfFontSize * radiusText.length) / 2,
        y: halfFontSize,
      };
      const This = this;
      return {
        padding: 0,
        textPosition,
        angle,
        centerAngle,
        originalDistance: originalDistance / this.pxPerMm,
        offset,
        radiusText,
        dragBoundFunc(pos) {
          This.dragTag(pos);
          return this.absolutePosition();
        },
      };
    },
    contextMenuAction() { return this.$store.state.contextMenuAction; },
    partPosition() { return this.part.position; },
    selectedColor() { return this.$store.state.selectedColor; },
  },
  watch: {
    contextMenuAction(data) {
      if (data.partIndex !== this.partIndex) return;
      if (data.borderIndex !== this.border.config.allBordersIndex) return;
      if (['hide', 'showRadius'].includes(data.action)) {
        const radiusTag = data.action === 'hide' ? {} : { isShown: true };
        this.$store.commit('setRadiusTagParams', {
          i: data.partIndex,
          j: data.borderIndex,
          ...radiusTag,
        });
        this.$store.commit('addLog');
      }
    },
    over(over) {
      if (over) {
        this.$store.commit('setCursor', 'move');
      } else {
        this.$store.commit('resetCursor');
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
    dragTag(pos) {
      const { x, y } = this.border.config;
      const x2 = pos.x;
      const y2 = pos.y;
      const x3 = this.partPosition.x;
      const y3 = this.partPosition.y;
      const vec = new Victor(x2 - (x + x3), y2 - (y + y3));
      const angle = vec.angleDeg();
      const correctAngle = angle - this.params.centerAngle;
      const correctDistance = vec.length() / this.pxPerMm - this.params.originalDistance;
      this.$store.commit('setRadiusTagParams', {
        i: this.partIndex,
        j: this.border.border.allBordersIndex,
        correctAngle,
        correctDistance,
        isShown: true,
      });
    },
    dragend() {
      this.$refs.label.getNode().clearCache();
      this.$store.commit('addLog');
    },
  },
};
</script>
