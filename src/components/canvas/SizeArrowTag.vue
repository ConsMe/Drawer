<template>
  <v-group
    v-if="border.border.sizeTag.isShown"
    ref="group">
    <v-arrow :config="{
      points: params.arrowPoints,
      stroke: 'black',
      fill: 'black',
      pointerAtBeginning: true,
      strokeWidth: 1,
      pointerLength : arrowLength,
      pointerWidth : 3,
      dash,
    }" />
    <v-label :config="{
        ...params.textPosition,
        rotation: params.angle,
        offset: params.offset,
        draggable: true,
        dragBoundFunc: params.dragBoundFunc,
      }"
      @mouseover="over = true"
      @mouseleave="over = false"
      @contextmenu="setContextMenuEvent"
      @dragstart="dragstart"
      @dragend="dragend">
      <v-tag :config="{fill: 'white'}" />
      <v-text :config="{
        text: params.lengthText,
        padding: params.padding,
        fontSize,
        fontFamily: 'Calibri',
        fill: over ? selectedColor : 'black',
        type: 'sizeArrow',
      }" />
    </v-label>
  </v-group>
</template>

<script>
import Victor from 'victor';

export default {
  props: ['border', 'partIndex', 'part'],
  data() {
    return {
      over: false,
      isCtrlKey: false,
      arrowLength: 3,
    };
  },
  computed: {
    sizeTag() { return this.border.border.sizeTag; },
    isControlPressed() { return this.$store.state.isControlPressed; },
    offsetInMm() {
      const { sizeTag } = this.border.border;
      if ('distance' in sizeTag) return sizeTag.distance;
      return this.border.border.skirting ? 70 : 50;
    },
    pxPerMm() { return this.$store.state.pxPerMm; },
    fontSize() { return this.$store.state.fontSizeInmM.sizeArrow * this.pxPerMm; },
    params() {
      // console.log(this.border.border.id);
      const { points } = this.border.config;
      const insideK = this.border.border.sizeTag.isInside ? -1 : 1;
      let startVec = new Victor(points[0], points[1]);
      let vec = new Victor(points[2] - points[0], points[3] - points[1]);
      let angle = vec.angleDeg();
      angle = angle < 0 ? angle + 360 : angle;
      const halfFontSize = this.fontSize / 2;
      let length = vec.length();
      const lengthText = Math.round(length / this.pxPerMm).toString();
      length -= this.arrowLength * 2;
      const offset = {
        x: halfFontSize * lengthText.length,
        y: halfFontSize,
      };
      const textOffset = length * 0.5 + offset.x / 2;
      const offsetInPx = this.offsetInMm * this.pxPerMm;
      vec = vec.norm().multiply(new Victor(this.arrowLength, this.arrowLength));
      startVec = vec.clone().add(startVec);
      vec = vec.norm().rotateDeg(-90 * insideK).multiply(new Victor(offsetInPx, offsetInPx));
      startVec = vec.clone().add(startVec);
      const p1 = startVec.toArray();
      const textVec = vec.clone().norm().rotateDeg(90 * insideK)
        .multiply(new Victor(textOffset, textOffset));
      const originalTextPosition = textVec.add(startVec).toObject();
      let textPosition;
      const { correctPosition } = this.border.border.sizeTag;
      let correctX;
      let correctY;
      if (correctPosition) {
        correctX = correctPosition.x * this.pxPerMm;
        correctY = correctPosition.y * this.pxPerMm;
        textPosition = {
          x: originalTextPosition.x + correctX,
          y: originalTextPosition.y + correctY,
        };
        p1[0] += correctX;
        p1[1] += correctY;
      } else {
        textPosition = originalTextPosition;
      }
      vec = vec.norm().rotateDeg(90 * insideK).multiply(new Victor(length, length));
      startVec = vec.clone().add(startVec);
      const p2 = startVec.toArray();
      if (correctPosition) {
        p2[0] += correctX;
        p2[1] += correctY;
      }
      const This = this;
      return {
        arrowPoints: [...p1, ...p2],
        originalTextPosition,
        textPosition,
        lengthText,
        padding: 0,
        angle,
        offset,
        dragBoundFunc(pos) {
          This.dragTag(pos);
          return this.absolutePosition();
        },
      };
    },
    partPosition() { return this.part.position; },
    contextMenuAction() { return this.$store.state.contextMenuAction; },
    dash() { return this.$store.state.dash; },
    selectedColor() { return this.$store.state.selectedColor; },
  },
  watch: {
    contextMenuAction(data) {
      if (data.partIndex !== this.partIndex) return;
      if (data.borderIndex !== this.border.config.allBordersIndex) return;
      if (data.action === 'hideSizeArrow') {
        this.$store.commit('setSizeTagParams', {
          i: data.partIndex,
          j: data.borderIndex,
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
      if (this.isCtrlKey) {
        this.dragTagFree(pos);
      } else {
        this.dragTagStrict(pos);
      }
    },
    dragTagStrict(pos) {
      const pts = this.border.border.pointsInPx;
      const x2 = pos.x - this.partPosition.x;
      const y2 = pos.y - this.partPosition.y;
      const vec1 = new Victor(pts[2] - pts[0], pts[3] - pts[1]);
      const vec2 = new Victor(x2 - pts[0], y2 - pts[1]);
      let angle1 = vec1.angleDeg();
      angle1 = angle1 >= 0 ? angle1 : angle1;
      let angle2 = vec2.angleDeg() - angle1;
      if (angle2 < -180) {
        angle2 += 360;
      } else if (angle2 > 180) {
        angle2 -= 360;
      }
      const cos = vec1.dot(vec2) / (vec1.length() * vec2.length());
      const angle = Math.acos(cos);
      const sin = Math.sin(angle);
      const distance = (sin * vec2.length()) / this.pxPerMm;
      this.$store.commit('setSizeTagParams', {
        i: this.partIndex,
        j: this.border.border.allBordersIndex,
        distance,
        isInside: angle2 > 0,
        isShown: true,
      });
    },
    dragTagFree(pos) {
      const x2 = pos.x - this.partPosition.x;
      const y2 = pos.y - this.partPosition.y;
      const { x, y } = this.params.originalTextPosition;
      this.$store.commit('setSizeTagParams', {
        i: this.partIndex,
        j: this.border.border.allBordersIndex,
        correctPosition: {
          x: (x2 - x) / this.pxPerMm,
          y: (y2 - y) / this.pxPerMm,
        },
        isShown: true,
      });
    },
    dragstart(e) {
      this.isCtrlKey = e.evt.ctrlKey;
    },
    dragend() {
      this.$refs.group.getNode().clearCache();
      this.$store.commit('addLog');
    },
  },
};
</script>
