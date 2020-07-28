<template>
  <div>
    <v-line
      :config="{
        ...config,
        stroke,
      }"
      ref="border"
      @dragstart="startBorderDrag($event, border)"
      @dragend="dragend"
      @contextmenu="setContextMenuEvent($event, borderIndex)"
      @mouseover="changeMouseOver(true, border.id)"
      @mouseleave="changeMouseOver(false)"
      @click="config.isClickable ? $store.commit('setSelectedElId', border.id) : ''" />
    <size-arrow-tag
      v-if="border.sizeTag && border.sizeTag.isShown"
      :border="border"
      :borderConfig="config"
      :partIndex="partIndex"
      :part="part" />
    <edge-tag
      v-if="border.edgeTag && border.edgeTag.isShown"
      :border="border"
      :borderConfig="config"
      :partIndex="partIndex"
      :part="part" />
  </div>
</template>

<script>
import Victor from 'victor';
import SizeArrowTag from './SizeArrowTag.vue';
import EdgeTag from './EdgeTag.vue';

export default {
  props: ['partIndex', 'borderIndex'],
  components: { SizeArrowTag, EdgeTag },
  data() {
    return {
      borderStartPoint: [0, 0],
      isCtrlKey: false,
      dependentInsetDepth: null,
    };
  },
  computed: {
    selectedElId() { return this.$store.state.selectedElId; },
    currentElId() { return this.$store.state.currentElId; },
    pxPerMm() { return this.$store.state.pxPerMm; },
    part() { return this.$store.state.parts.partsInit[this.partIndex]; },
    border() { return this.part.borders[this.borderIndex]; },
    partPosition() { return this.part.position; },
    selectedColor() { return this.$store.state.selectedColor; },
    lineCap() {
      const prev = this.borderIndex ? this.part.borders[this.borderIndex - 1]
        : this.part.borders[this.part.borders.length - 1];
      const next = this.borderIndex < this.part.borders.length - 1
        ? this.part.borders[this.borderIndex + 1] : this.part.borders[0];
      return prev.skirting && next.skirting ? 'square' : 'butt';
    },
    points() {
      const p1 = this.$store.state.parts.partsInit[this.partIndex]
        .points.find((p) => p.id === this.border.pointsId[0]).c;
      const p2 = this.$store.state.parts.partsInit[this.partIndex]
        .points.find((p) => p.id === this.border.pointsId[1]).c;
      return [...p1, ...p2];
    },
    isSizeTagShown() { return this.border.sizeTag.isShown; },
    stroke() {
      return [this.currentElId, this.selectedElId].includes(this.border.id)
        || this.selectedElId === this.part.id ? this.selectedColor : 'black';
    },
    config() {
      this.console.log('lineBorder', this.border.id);
      const { type, id } = this.border;
      const { skirting, subType } = this.border;
      const This = this;
      return {
        type,
        id,
        points: this.points.map((p) => p * this.pxPerMm),
        strokeWidth: skirting ? 4 : 1,
        lineCap: this.lineCap,
        hitStrokeWidth: 5,
        allBordersIndex: this.borderIndex,
        // sizeTag: { isShown: this.isSizeTagShown },
        isClickable: !['inset', 'bulge'].includes(subType),
        isHoverable: true,
        draggable: true,
        dragBoundFunc(pos) {
          This.dragBorder(pos);
          return this.absolutePosition();
        },
      };
    },
  },
  watch: {
    // border(nv, ov) {
    //   console.log('border', this.border.id, nv, ov);
    // },
  },
  // updated() {
  //   console.log('border', this.border.id);
  // },
  methods: {
    setContextMenuEvent(e, index) {
      const { partIndex } = this;
      this.$store.commit('setContextMenuEvent', { e, partIndex, borderIndex: index });
    },
    dragBorder(pos) {
      const { border } = this;
      const pts = this.points;
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
      if (this.dependentInsetDepth) this.setInsetBulgeDepth(newPoint1, angle1);
    },
    checkSiblingLines(p1, p2) {
      const prev = this.borderIndex ? this.part.borders[this.borderIndex - 1]
        : this.part.borders[this.part.borders.length - 1];
      const next = this.borderIndex < this.part.borders.length - 1
        ? this.part.borders[this.borderIndex + 1] : this.part.borders[0];
      if (prev.type === 'curveBorder') {
        const point = this.part.points[prev.pointsIndexes[0]].c;
        const vec = new Victor(p1.x - point[0], p1.y - point[1]);
        if (vec.length() > Math.ceil(prev.radius * 2)) return false;
      }
      if (next.type === 'curveBorder') {
        const point = this.part.points[next.pointsIndexes[1]].c;
        const vec = new Victor(point[0] - p2.x, point[1] - p2.y);
        if (vec.length() > Math.ceil(next.radius * 2)) return false;
      }
      return true;
    },
    setInsetBulgeDepth(point, angle1) {
      const pts = this.part.points[this.dependentInsetDepth.insetBulge.pointsIndexes[0]].c;
      const vec = new Victor(pts[0] - point.x, pts[1] - point.y);
      const angle = angle1 - vec.angleDeg();
      const depth = vec.length() * Math.sin(angle * (Math.PI / 180));
      this.$store.commit('setInsetBulgeDepth', {
        i: this.partIndex,
        j: this.dependentInsetDepth.index,
        depth: this.dependentInsetDepth.insetBulge.type === 'inset' ? depth : -depth,
      });
    },
    startBorderDrag(e, border) {
      this.isCtrlKey = e.evt.ctrlKey;
      const { points } = this;
      this.borderStartPoint = [points[0], points[1]];
      let index = -1;
      if (this.part.insetsBulges) {
        index = this.part.insetsBulges.findIndex((ib) => {
          const ids = [ib.pointsId[1], ib.pointsId[2]];
          return ids.includes(border.pointsId[0]) && ids.includes(border.pointsId[1]);
        });
      }
      this.dependentInsetDepth = index < 0 ? null : {
        index,
        insetBulge: this.clone(this.part.insetsBulges[index]),
      };
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
