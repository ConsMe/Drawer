<template>
  <div>
    <v-line
      :config="{
        ...config,
        strokeWidth: [currentElId, selectedElId].includes(iB.id) ? 2 : 0,
      }"
      @dragstart="startIBDrag"
      @mouseover="$store.commit('setCurrentEl', iB.id)"
      @mouseleave="$store.commit('setCurrentEl', null)"
      @click="$store.commit('setSelectedElId', iB.id)"
      @contextmenu="setContextMenuEvent($event, iBIndex)" />
  </div>
</template>

<script>
import Victor from 'victor';

export default {
  props: ['partIndex', 'iBIndex'],
  data() {
    return {
      iBStartPoint: [0, 0],
      isCtrlKey: false,
    };
  },
  computed: {
    part() { return this.$store.state.parts.partsInit[this.partIndex]; },
    iB() { return this.part.insetsBulges[this.iBIndex]; },
    pxPerMm() { return this.$store.state.pxPerMm; },
    dash() { return [this.pxPerMm * 30, this.pxPerMm * 15]; },
    selectedColor() { return this.$store.state.selectedColor; },
    points() {
      const points = [];
      this.iB.pointsIndexes.forEach((j) => {
        points.push(...this.part.points[j].c);
      });
      return points;
    },
    config() {
      const This = this;
      const { iB, points } = this;
      const { id, type } = iB;
      this.console.log('insetBulge', id);
      return {
        id,
        points: points.map((p) => p * this.pxPerMm),
        closed: true,
        dash: this.dash,
        stroke: this.selectedColor,
        type,
        draggable: true,
        dragBoundFunc(pos) {
          This.dragIB(pos);
          return this.absolutePosition();
        },
      };
    },
    selectedElId() { return this.$store.state.selectedElId; },
    currentElId() { return this.$store.state.currentElId; },
    partPosition() { return this.part.position; },
    contextMenuAction() { return this.$store.state.contextMenuAction; },
  },
  watch: {
    contextMenuAction(data) {
      if (data.partIndex !== this.partIndex) return;
      if (data.insetBulgeIndex !== this.iBIndex) return;
      if (data.action === 'deleteInsetBulge') {
        this.deleteInsetBulge();
      }
    },
  },
  methods: {
    setContextMenuEvent(e, index) {
      const { partIndex } = this;
      this.$store.commit('setContextMenuEvent', { e, partIndex, insetBulgeIndex: index });
    },
    deleteInsetBulge() {
      const { pointsIndexes } = this.iB;
      const { partIndex } = this;
      this.$store.commit('setSelectedElId', null);
      this.$store.dispatch('deleteInsetBulge', { i: partIndex, j: this.iBIndex });
      new Array(4).fill('').forEach(() => {
        this.$store.dispatch('deletePoint', { i: partIndex, j: pointsIndexes[0] });
      });
    },
    startIBDrag(e) {
      this.isCtrlKey = e.evt.ctrlKey;
      this.iBStartPoint = this.clone(this.points);
    },
    dragIB(pos) {
      const pts = this.points;
      const pts2 = this.iBStartPoint;
      const x2 = (pos.x - this.partPosition.x) / this.pxPerMm + pts2[0];
      const y2 = (pos.y - this.partPosition.y) / this.pxPerMm + pts2[1];
      const vec1 = new Victor(pts[6] - pts[0], pts[7] - pts[1]);
      const vec2 = new Victor(x2 - pts2[0], y2 - pts2[1]);
      let angle1 = vec1.angleDeg();
      angle1 = angle1 >= 0 ? angle1 : angle1;
      let angle2 = vec2.angleDeg() - angle1;
      if (angle2 < -180) {
        angle2 += 360;
      } else if (angle2 > 180) {
        angle2 -= 360;
      }
      const cos = vec1.dot(vec2) / (vec1.length() * vec2.length());
      let distance = (cos * vec2.length());
      if (!this.isCtrlKey) distance = Math.round(distance / 10) * 10;
      if (!distance) return;
      const dopVec = new Victor().norm().rotateDeg(angle1)
        .multiply(new Victor(distance, distance));
      this.iB.pointsId.forEach((id, index) => {
        this.$store.commit('changePoint', {
          i: this.partIndex,
          j: this.iB.pointsIndexes[index],
          point: new Victor(pts2[index * 2], pts2[index * 2 + 1]).add(dopVec).toObject(),
        });
      });
    },
  },
};
</script>
