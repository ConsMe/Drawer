<template>
  <div>
    <line-border
      v-for="border in borders.lineBorder"
      :key="border.id"
      :border="border"
      :part="part"
      :partIndex="partIndex" />
    <curve-border
      v-for="border in borders.curveBorder"
      :key="border.id"
      :border="border"
      :part="part"
      :partIndex="partIndex"
      :curves="curves" />
  </div>
</template>

<script>
import Victor from 'victor';
import getId from '../../mixins/getId';
import LineBorder from './LineBorder.vue';
import CurveBorder from './CurveBorder.vue';

export default {
  mixins: [getId],
  props: ['part', 'partIndex', 'curves', 'shape'],
  components: {
    LineBorder, CurveBorder,
  },
  computed: {
    selectedElId() { return this.$store.state.selectedElId; },
    currentElId() { return this.$store.state.currentElId; },
    pxPerMm() { return this.$store.state.pxPerMm; },
    partPosition() { return this.part.position; },
    borders() {
      const borders = {};
      this.part.borders.forEach((border, i) => {
        if (!(border.type in borders)) borders[border.type] = [];
        borders[border.type].push({ ...border, allBordersIndex: i });
      });
      return borders;
    },
    contextMenuAction() { return this.$store.state.contextMenuAction; },
    refreshSelectedElTrigger() { return this.$store.state.parts.refreshSelectedElTrigger; },
    selectedColor() { return this.$store.state.selectedColor; },
  },
  watch: {
    contextMenuAction(data) {
      if (data.partIndex !== this.partIndex) return;
      if (data.action === 'makeBorderCurve') {
        this.makeBorderCurve(data);
      } else if (data.action === 'makeBorderLine') {
        this.$store.dispatch('makeBorderLine', data);
        this.$store.commit('addLog');
      } else if (data.action === 'makeBulgeInset') {
        this.makeBulgeInset(data);
      } else if (data.action === 'toggleSkirting') {
        this.$store.commit('toggleSkirting', { i: data.partIndex, j: data.borderIndex });
        this.$store.commit('addLog');
      } else if (data.action === 'showSizeArrow') {
        this.$store.commit('setSizeTagParams', {
          i: data.partIndex,
          j: data.borderIndex,
          isShown: true,
        });
        this.$store.commit('addLog');
      } else if (data.action === 'addEdge') {
        const payload = {
          i: data.partIndex,
          j: data.borderIndex,
          isShown: true,
          id: this.getId(),
        };
        this.$store.commit('setEdgeTagParams', payload);
        this.$store.commit('addLog');
      }
    },
    refreshSelectedElTrigger() {
      this.$refs[`border${this.selectedElId}`][0].getNode().fire('click');
    },
  },
  methods: {
    setContextMenuEvent(e, index) {
      const { partIndex } = this;
      this.$store.commit('setContextMenuEvent', { e, partIndex, borderIndex: index });
    },
    makeBorderCurve(data) {
      const pts = this.clone(this.part.borders[data.borderIndex].points);
      const borderLength = Math.sqrt((pts[2] - pts[0]) ** 2 + (pts[3] - pts[1]) ** 2);
      const radius = data.isInside ? borderLength : borderLength / 2 + 2;
      this.$store.dispatch('makeBorderCurve', Object.assign(data, { radius }));
      this.$store.commit('addLog');
    },
    makeBulgeInset(data) {
      const pts = this.clone(this.part.borders[data.borderIndex].points);
      const newPoints = [];
      const depth = 300;
      const k = data.isInside ? 1 : -1;
      let startVec = new Victor(pts[0], pts[1]);
      let vec = new Victor(pts[2] - pts[0], pts[3] - pts[1]);
      const length = vec.length();
      const norm = vec.norm();
      vec = norm.multiply(new Victor(length / 3, length / 3));
      startVec = vec.clone().add(startVec);
      newPoints.push(startVec.toArray());
      vec = vec.norm().rotateDeg(90 * k).multiply(new Victor(depth, depth));
      startVec = vec.clone().add(startVec);
      newPoints.push(startVec.toArray());
      vec = vec.norm().rotateDeg(-90 * k).multiply(new Victor(length / 3, length / 3));
      startVec = vec.clone().add(startVec);
      newPoints.push(startVec.toArray());
      vec = vec.norm().rotateDeg(-90 * k).multiply(new Victor(depth, depth));
      startVec = vec.clone().add(startVec);
      newPoints.push(startVec.toArray());
      const { partIndex, borderIndex } = data;
      const subType = data.isInside ? 'inset' : 'bulge';
      const pointsId = [];
      const insetBulgeId = this.getId();
      newPoints.forEach((p, index) => {
        const border = { id: this.getId(), type: 'lineBorder', sizeTag: { isShown: true } };
        if (index < 3) border.subType = subType;
        this.$store.commit('addBorder', {
          partIndex,
          borderIndex: borderIndex + index + 1,
          border,
        });
        const newPointId = this.getId();
        const point = { id: newPointId, c: p, subType };
        this.$store.commit('addPoint', {
          partIndex,
          pointIndex: borderIndex + index + 1,
          point: { ...point, insetBulgeId },
        });
        pointsId.push(newPointId);
      });
      const insetBulge = { partIndex, pointsId, id: insetBulgeId };
      this.$store.commit('addInsetBulge', { ...insetBulge, type: subType, depth });
      this.$store.commit('setSelectedElId', insetBulgeId);
      this.$store.commit('addLog');
    },
    checkOtherLinesLength(p1, p2) {
      const stage = this.shape.getNode().getStage();
      const inter1 = stage.getIntersection({ x: p1.x * this.pxPerMm, y: p1.y * this.pxPerMm });
      const inter2 = stage.getIntersection({ x: p2.x * this.pxPerMm, y: p2.y * this.pxPerMm });
      console.log(inter1, inter2);
      // if (!inter1 || inter1.attrs.id !== this.part.id) return false;
      // if (!inter2 || inter2.attrs.id !== this.part.id) return false;
      // if (!inter1 || inter1.attrs.type !== 'part') return false;
      // if (!inter2 || inter2.attrs.type !== 'part') return false;
      return true;
    },
  },
};
</script>
