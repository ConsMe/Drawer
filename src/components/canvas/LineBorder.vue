<template>
  <div>
    <v-line
      :config="{
        ...config,
        stroke: [currentElId, selectedElId].includes(border.id) || selectedElId === part.id
          ? selectedColor : 'black',
      }"
      ref="border"
      @dragstart="startBorderDrag($event, border)"
      @dragend="dragend"
      @contextmenu="setContextMenuEvent($event, config.allBordersIndex)"
      @mouseover="changeMouseOver(true, border.id)"
      @mouseleave="changeMouseOver(false)"
      @click="config.isClickable ? $store.commit('setSelectedElId', border.id) : ''" />
    <size-arrow-tag
      v-if="border.sizeTag.isShown"
      :border="{ border, config }"
      :partIndex="partIndex"
      :part="part" />
    <edge
      v-if="border.edgeTag.isShown"
      :border="{ border, config }"
      :partIndex="partIndex"
      :part="part" />
  </div>
</template>

<script>
import Victor from 'victor';
import SizeArrowTag from './SizeArrowTag.vue';
import Edge from './Edge.vue';

export default {
  props: ['border', 'part', 'partIndex'],
  components: { SizeArrowTag, Edge },
  data() {
    return {
      borderStartPoint: [0, 0],
      isCtrlKey: false,
    };
  },
  computed: {
    selectedElId() { return this.$store.state.selectedElId; },
    currentElId() { return this.$store.state.currentElId; },
    pxPerMm() { return this.$store.state.pxPerMm; },
    partPosition() { return this.part.position; },
    selectedColor() { return this.$store.state.selectedColor; },
    config() {
      // console.log(this.border.id);
      const { border } = this;
      const prev = border.allBordersIndex ? this.part.borders[border.allBordersIndex - 1]
        : this.part.borders[this.part.borders.length - 1];
      const next = border.allBordersIndex < this.part.borders.length - 1
        ? this.part.borders[border.allBordersIndex + 1] : this.part.borders[0];
      const { type, id, points } = border;
      const This = this;
      return {
        type,
        id,
        points: points.map((p) => p * this.pxPerMm),
        strokeWidth: border.skirting ? 4 : 1,
        lineCap: prev.skirting && next.skirting ? 'square' : 'butt',
        hitStrokeWidth: 5,
        allBordersIndex: border.allBordersIndex,
        isClickable: !['inset', 'bulge'].includes(border.subType),
        // isHoverable: !['inset', 'bulge'].includes(border.subType) || !border.sizeTag.isShown,
        isHoverable: true,
        sizeTag: border.sizeTag,
        draggable: true,
        dragBoundFunc(pos) {
          This.dragBorder(pos, border);
          return this.absolutePosition();
        },
      };
    },
  },
  methods: {
    setContextMenuEvent(e, index) {
      const { partIndex } = this;
      this.$store.commit('setContextMenuEvent', { e, partIndex, borderIndex: index });
    },
    dragBorder(pos, border) {
      const pts = border.points;
      const pts2 = this.borderStartPoint;
      const x2 = (pos.x - this.partPosition.x) / this.pxPerMm + pts2[0];
      const y2 = (pos.y - this.partPosition.y) / this.pxPerMm + pts2[1];
      let vec1 = new Victor(pts[2] - pts[0], pts[3] - pts[1]);
      const borderLength = vec1.length();
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
      const angle = Math.acos(cos);
      const sin = Math.sin(angle);
      let distance = (sin * vec2.length());
      if (!this.isCtrlKey) distance = Math.round(distance / 10) * 10;
      if (!distance) return;
      const startVec = new Victor(pts2[0], pts2[1]);
      const angleK = angle2 > 0 ? 1 : -1;
      vec1 = vec1.norm().rotateDeg(90 * angleK).multiply(new Victor(distance, distance));
      const newPoint1 = vec1.clone().add(startVec).toObject();
      vec1 = vec1.norm().rotateDeg(-90 * angleK).multiply(new Victor(borderLength, borderLength));
      const newPoint2 = vec1.clone().add(new Victor(newPoint1.x, newPoint1.y)).toObject();
      if (!this.checkSiblingLines(newPoint1, newPoint2)) return;
      this.$store.commit('changePoint', { i: this.partIndex, j: border.pointsIndexes[0], point: newPoint1 });
      this.$store.commit('changePoint', { i: this.partIndex, j: border.pointsIndexes[1], point: newPoint2 });
    },
    checkSiblingLines(p1, p2) {
      const { border } = this;
      const prev = border.allBordersIndex ? this.part.borders[border.allBordersIndex - 1]
        : this.part.borders[this.part.borders.length - 1];
      const next = border.allBordersIndex < this.part.borders.length - 1
        ? this.part.borders[border.allBordersIndex + 1] : this.part.borders[0];
      if (prev.type === 'curveBorder') {
        const vec = new Victor(p1.x - prev.points[0], p1.y - prev.points[1]);
        if (vec.length() > prev.radius * 2 - 1) return false;
      }
      if (next.type === 'curveBorder') {
        const vec = new Victor(next.points[2] - p2.x, next.points[3] - p2.y);
        if (vec.length() > next.radius * 2 - 1) return false;
      }
      return true;
    },
    startBorderDrag(e, border) {
      this.isCtrlKey = e.evt.ctrlKey;
      const { points } = border;
      this.borderStartPoint = [points[0], points[1]];
      // this.$store.commit('setSelectedElId', id);
    },
    dragend() {
      this.$refs.border.getNode().clearCache();
      this.$store.commit('addLog');
    },
    changeMouseOver(isOver, borderId) {
      const id = isOver ? borderId : null;
      const cursorMutation = isOver ? 'setCursor' : 'resetCursor';
      this.$store.commit('setCurrentEl', id);
      this.$store.commit(cursorMutation, 'move');
    },
  },
};
</script>
