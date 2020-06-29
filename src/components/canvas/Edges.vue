<template>
  <v-image :config="{
    image,
    x: params.x,
    y: params.y,
    width: sizeInPx,
    height: sizeInPx,
    rotation: params.angle,
    offset: { x: sizeInPx / 2, y: sizeInPx / 2 },
    type: 'edge',
  }"
  v-if="edge && image"
  @mouseover="$store.commit('setCurrentEl', edge.id)"
  @mouseleave="$store.commit('setCurrentEl', null)"
  @contextmenu="setContextMenuEvent"
  @click="$store.commit('setSelectedElId', edge.id)" />
</template>

<script>
import Victor from 'victor';
import getId from '../../mixins/getId';

export default {
  mixins: [getId],
  props: ['border', 'partIndex'],
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
    edge() { return this.border.border.edge; },
    image() {
      const image = [this.selectedElId, this.currentElId].includes(this.edge.id)
        ? this.$store.state.files.edges[`${this.edge.edgeType}Hover`]
        : this.$store.state.files.edges[this.edge.edgeType];
      return image;
    },
    pxPerMm() { return this.$store.state.pxPerMm; },
    sizeInPx() { return this.sizeInMm * this.pxPerMm; },
    params() {
      if (!this.edge) return {};
      const pts = this.border.border.pointsInPx;
      if (this.border.border.type === 'lineBorder') {
        let startVec = new Victor(pts[0], pts[1]);
        let vec = new Victor(pts[2] - pts[0], pts[3] - pts[1]);
        const middleLength = vec.length() / 2;
        let angle = vec.angleDeg();
        angle = angle < 0 ? angle + 180 : angle - 180;
        vec = vec.norm().multiply(new Victor(middleLength, middleLength));
        startVec = vec.clone().add(startVec);
        const offset = this.offsetInMm * this.pxPerMm;
        vec = vec.norm().rotateDeg(-90).multiply(new Victor(offset, offset));
        const { x, y } = vec.clone().add(startVec).toObject();
        return { angle, x, y };
      }
      const { x, y } = this.border.config;
      let startVec = new Victor(pts[0], pts[1]);
      let vec = new Victor(pts[2] - pts[0], pts[3] - pts[1]);
      let angle = vec.angleDeg();
      angle = angle < 0 ? angle + 180 : angle - 180;
      const halfLength = vec.length() / 2;
      vec = vec.norm().multiply(new Victor(halfLength, halfLength));
      const halfPoint = vec.clone().add(startVec);
      startVec = new Victor(x, y);
      vec = new Victor(halfPoint.x - x, halfPoint.y - y);
      const isInsideK = this.border.border.isInside ? 1 : -1;
      const edgeDistance = this.border.config.innerRadius
        - this.offsetInMm * this.pxPerMm * isInsideK;
      vec = vec.norm().multiply(new Victor(edgeDistance, edgeDistance));
      const edgePosition = vec.clone().add(startVec).toObject();
      return {
        ...edgePosition,
        angle,
      };
    },
    contextMenuAction() { return this.$store.state.contextMenuAction; },
  },
  watch: {
    contextMenuAction(data) {
      if (data.partIndex !== this.partIndex) return;
      if (data.borderIndex !== this.border.config.allBordersIndex) return;
      if (['addEdge', 'hideEdge'].includes(data.action)) {
        const payload = {
          i: data.partIndex,
          j: data.borderIndex,
          action: data.action,
        };
        if (data.action === 'addEdge') payload.id = this.getId();
        this.$store.commit('addHideEdge', payload);
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
