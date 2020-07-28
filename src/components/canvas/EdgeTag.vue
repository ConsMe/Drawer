<template>
  <v-image :config="{
    image,
    x: params.x,
    y: params.y,
    width: sizeInPx,
    height: sizeInPx,
    rotation: params.angle,
    offset: { x: imageOffset, y: imageOffset },
    type: 'edge',
    draggable: true,
    dragBoundFunc: params.dragBoundFunc,
  }"
  ref="image"
  v-if="edge.isShown && image"
  @mouseover="over = true"
  @mouseleave="over = false"
  @contextmenu="setContextMenuEvent"
  @click="$store.commit('setSelectedElId', edge.id)"
  @dragend="dragend" />
</template>

<script>
import Victor from 'victor';
import getId from '../../mixins/getId';

export default {
  mixins: [getId],
  props: ['border', 'partIndex', 'part', 'borderConfig'],
  data() {
    return {
      offsetInMm: 50,
      over: false,
      sizeInMm: 120,
    };
  },
  computed: {
    selectedElId() { return this.$store.state.selectedElId; },
    currentElId() { return this.$store.state.currentElId; },
    edge() { return this.border.edgeTag; },
    image() {
      const image = [this.selectedElId, this.currentElId].includes(this.edge.id)
        ? this.$store.state.files.edges[`${this.edge.edgeType}Hover`]
        : this.$store.state.files.edges[this.edge.edgeType];
      return image;
    },
    pxPerMm() { return this.$store.state.pxPerMm; },
    sizeInPx() { return this.sizeInMm * this.pxPerMm; },
    imageOffset() { return this.sizeInPx / 2; },
    params() {
      this.console.log('edgeTag', this.border.id);
      if (!this.edge.isShown) return {};
      const pts = this.borderConfig.points;
      const This = this;
      const correctDistance = this.border.edgeTag.correctDistance || 0;
      if (this.border.type === 'lineBorder') {
        let startVec = new Victor(pts[0], pts[1]);
        let vec = new Victor(pts[2] - pts[0], pts[3] - pts[1]);
        const originalDistance = vec.length() / 2;
        const middleLength = originalDistance + correctDistance * this.pxPerMm;
        let angle = vec.angleDeg();
        angle = angle < 0 ? angle + 180 : angle - 180;
        vec = vec.norm().multiply(new Victor(middleLength, middleLength));
        startVec = vec.clone().add(startVec);
        const offset = this.offsetInMm * this.pxPerMm;
        vec = vec.norm().rotateDeg(-90).multiply(new Victor(offset, offset));
        const { x, y } = vec.clone().add(startVec).toObject();
        return {
          angle,
          x,
          y,
          originalDistance: originalDistance / this.pxPerMm,
          dragBoundFunc(pos) {
            This.dragTag(pos, 'line');
            return this.absolutePosition();
          },
        };
      }
      const { x, y } = this.borderConfig;
      const correctAngle = this.border.edgeTag.correctAngle || 0;
      let startVec = new Victor(pts[0], pts[1]);
      let vec = new Victor(pts[2] - pts[0], pts[3] - pts[1]);
      let angle = vec.angleDeg();
      angle = angle < 0 ? angle + 180 : angle - 180;
      angle += correctAngle;
      const halfLength = vec.length() / 2;
      vec = vec.norm().multiply(new Victor(halfLength, halfLength));
      const halfPoint = vec.clone().add(startVec);
      startVec = new Victor(x, y);
      vec = new Victor(halfPoint.x - x, halfPoint.y - y);
      const centerAngle = vec.angleDeg();
      const isInsideK = this.border.isInside ? 1 : -1;
      const originalDistance = this.borderConfig.innerRadius
        - this.offsetInMm * this.pxPerMm * isInsideK;
      const edgeDistance = originalDistance + correctDistance * this.pxPerMm;
      vec = vec.norm().rotateDeg(correctAngle).multiply(new Victor(edgeDistance, edgeDistance));
      const edgePosition = vec.clone().add(startVec).toObject();
      return {
        ...edgePosition,
        centerAngle,
        originalDistance: originalDistance / this.pxPerMm,
        angle,
        dragBoundFunc(pos) {
          This.dragTag(pos, 'curve');
          return this.absolutePosition();
        },
      };
    },
    partPosition() { return this.part.position; },
    contextMenuAction() { return this.$store.state.contextMenuAction; },
  },
  watch: {
    contextMenuAction(data) {
      if (data.partIndex !== this.partIndex) return;
      if (data.borderIndex !== this.borderConfig.allBordersIndex) return;
      if (data.action === 'hideEdge') {
        const payload = {
          i: data.partIndex,
          j: data.borderIndex,
          isShown: false,
        };
        this.$store.commit('setEdgeTagParams', payload);
        this.$store.commit('addLog');
      }
    },
    'params.originalDistance': function check(nv) {
      const correctDistance = this.border.edgeTag.correctDistance || 0;
      const middleLength = nv + correctDistance;
      const imageOffset = this.imageOffset / this.pxPerMm;
      if (middleLength < imageOffset) {
        this.$store.commit('setEdgeTagParams', {
          i: this.partIndex,
          j: this.borderConfig.allBordersIndex,
          correctDistance: imageOffset - nv,
        });
        return;
      }
      const max = nv * 2 - imageOffset;
      if (middleLength > max) {
        this.$store.commit('setEdgeTagParams', {
          i: this.partIndex,
          j: this.borderConfig.allBordersIndex,
          correctDistance: max - nv,
        });
      }
    },
    over(over) {
      if (over) {
        this.$store.commit('setCurrentEl', this.edge.id);
        this.$store.commit('setCursor', 'move');
      } else {
        this.$store.commit('setCurrentEl', null);
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
        borderIndex: this.borderConfig.allBordersIndex,
      });
    },
    dragTag(pos, type) {
      if (type === 'curve') {
        const { x, y } = this.borderConfig;
        const x2 = pos.x;
        const y2 = pos.y;
        const x3 = this.partPosition.x;
        const y3 = this.partPosition.y;
        const vec = new Victor(x2 - (x + x3), y2 - (y + y3));
        const angle = vec.angleDeg();
        const correctAngle = angle - this.params.centerAngle;
        this.$store.commit('setEdgeTagParams', {
          i: this.partIndex,
          j: this.borderConfig.allBordersIndex,
          correctAngle,
        });
      } else if (type === 'line') {
        const x2 = pos.x - this.partPosition.x;
        const y2 = pos.y - this.partPosition.y;
        const pts = this.borderConfig.points;
        const vec1 = new Victor(pts[2] - pts[0], pts[3] - pts[1]);
        const vec2 = new Victor(x2 - pts[0], y2 - pts[1]);
        const cos = vec1.dot(vec2) / (vec1.length() * vec2.length());
        const angle = Math.acos(cos);
        const distance = cos * vec2.length();
        let correctDistance;
        if (angle > Math.PI / 2) {
          correctDistance = -this.params.originalDistance + this.imageOffset / this.sizeInPx;
        } else {
          correctDistance = distance > vec1.length()
            ? this.params.originalDistance - this.imageOffset / this.sizeInPx
            : distance / this.pxPerMm - this.params.originalDistance;
        }
        this.$store.commit('setEdgeTagParams', {
          i: this.partIndex,
          j: this.borderConfig.allBordersIndex,
          correctDistance,
        });
      }
    },
    dragend() {
      this.$refs.image.getNode().clearCache();
      this.$store.commit('addLog');
    },
  },
};
</script>
