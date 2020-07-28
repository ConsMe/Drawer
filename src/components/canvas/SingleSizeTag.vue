<template>
  <v-group
    ref="group"
    @mouseover="$store.commit('setCurrentEl', sizeTag.id)"
    @mouseleave="$store.commit('setCurrentEl', null)"
    @click="$store.commit('setSelectedElId', sizeTag.id)">
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
        type: 'singleSizeTag',
      }" />
    </v-label>
    <v-circle
      :config="{
        ...circles,
        x: params.arrowPoints[0],
        y: params.arrowPoints[1],
        draggable: true,
        dragBoundFunc: dragPointFunc,
      }"
      @dragstart="dragstart($event, 1)"  />
    <v-circle
      :config="{
        ...circles,
        x: params.arrowPoints[2],
        y: params.arrowPoints[3],
        draggable: true,
        dragBoundFunc: dragPointFunc,
      }"
      @dragstart="dragstart($event, 2)"  />
  </v-group>
</template>

<script>
import Victor from 'victor';

export default {
  props: ['partIndex', 'sizeTagIndex'],
  data() {
    const This = this;
    return {
      over: false,
      isCtrlKey: false,
      arrowLength: 3,
      startDragData: {},
      dragPointFunc(pos) {
        This.dragPoint(pos);
        return this.absolutePosition();
      },
    };
  },
  computed: {
    pxPerMm() { return this.$store.state.pxPerMm; },
    fontSize() { return this.$store.state.fontSizeInmM.sizeArrow * this.pxPerMm; },
    selectedElId() { return this.$store.state.selectedElId; },
    currentElId() { return this.$store.state.currentElId; },
    part() { return this.$store.state.parts.partsInit[this.partIndex]; },
    sizeTag() { return this.part.singleSizeTags[this.sizeTagIndex]; },
    points() { return this.sizeTag.points; },
    circles() {
      const circles = { radius: 60 * this.pxPerMm, fill: 'transparent' };
      if ([this.currentElId, this.selectedElId].includes(this.sizeTag.id)) {
        circles.fill = this.selectedColor;
      }
      return circles;
    },
    params() {
      const pts = this.sizeTag.points.map((c) => c * this.pxPerMm);
      const startVec = new Victor(pts[0], pts[1]);
      const vec = new Victor(pts[2] - pts[0], pts[3] - pts[1]);
      let angle = vec.angleDeg();
      angle = angle < 0 ? angle + 360 : angle;
      const halfFontSize = this.fontSize / 2;
      const length = vec.length();
      const lengthText = Math.round((length + this.arrowLength * 2) / this.pxPerMm).toString();
      // length -= this.arrowLength * 2;
      const offset = {
        x: halfFontSize * lengthText.length,
        y: halfFontSize,
      };
      const textOffset = length * 0.5 + offset.x / 2;
      const textVec = vec.clone().norm().multiply(new Victor(textOffset, textOffset));
      const textPosition = textVec.add(startVec).toObject();
      const This = this;
      return {
        arrowPoints: pts,
        textPosition,
        lengthText,
        padding: 0,
        angle,
        offset,
        dragBoundFunc(pos) {
          This.dragTag(pos);
          // return pos;
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
      if (data.sizeTagIndex !== this.sizeTagIndex) return;
      if (data.action === 'deleteSingleSizeTag') {
        setTimeout(() => {
          this.$store.commit('deleteSingleSizeTag', {
            i: data.partIndex,
            j: data.sizeTagIndex,
          });
          this.$store.commit('addLog');
        }, 0);
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
      const { partIndex, sizeTagIndex } = this;
      this.$store.commit('setContextMenuEvent', {
        e,
        partIndex,
        sizeTagIndex,
      });
    },
    dragTag(pos) {
      const { startPoint, pts } = this.startDragData;
      const diffX = (pos.x - startPoint.x) / this.pxPerMm;
      const diffY = (pos.y - startPoint.y) / this.pxPerMm;
      const points = [
        pts[0] + diffX,
        pts[1] + diffY,
        pts[2] + diffX,
        pts[3] + diffY,
      ];
      this.$store.commit('setSingleSizeTagParams', {
        i: this.partIndex,
        j: this.sizeTagIndex,
        points,
      });
    },
    dragPoint(pos) {
      const { startPoint, pts, pointNum } = this.startDragData;
      const diffX = (pos.x - startPoint.x) / this.pxPerMm;
      const diffY = (pos.y - startPoint.y) / this.pxPerMm;
      const points = this.clone(pts);
      if (pointNum === 1) {
        points[0] += diffX;
        points[1] += diffY;
      } else {
        points[2] += diffX;
        points[3] += diffY;
      }
      this.$store.commit('setSingleSizeTagParams', {
        i: this.partIndex,
        j: this.sizeTagIndex,
        points,
      });
    },
    dragstart(e, pointNum) {
      this.isCtrlKey = e.evt.ctrlKey;
      this.startDragData = {
        startPoint: e.target.absolutePosition(),
        pts: this.clone(this.sizeTag.points),
        pointNum,
      };
    },
    dragend() {
      this.$refs.group.getNode().clearCache();
      this.$store.commit('addLog');
    },
  },
};
</script>
