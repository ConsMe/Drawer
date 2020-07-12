<template>
  <div>
    <v-line
      v-for="b in lineBorders"
      :key="b.border.id"
      :config="{
        ...b.config,
        stroke: [currentElId, selectedElId].includes(b.border.id) || selectedElId === part.id
          ? selectedColor : 'black',
      }"
      :ref="`border${b.border.id}`"
      @contextmenu="setContextMenuEvent($event, b.config.allBordersIndex)"
      @mouseover="$store.commit('setCurrentEl', b.border.id)"
      @mouseleave="$store.commit('setCurrentEl', null)"
      @click="b.config.isClickable ? $store.commit('setSelectedElId', b.border.id) : ''" />
    <v-arc
      v-for="b in curveBorders"
      :key="b.border.id"
      :config="{
        ...b.config,
        stroke: [currentElId, selectedElId].includes(b.border.id) || selectedElId === part.id
          ? selectedColor : 'black',
      }"
      :ref="`border${b.border.id}`"
      @contextmenu="setContextMenuEvent($event, b.config.allBordersIndex)"
      @mouseover="$store.commit('setCurrentEl', b.border.id)"
      @mouseleave="$store.commit('setCurrentEl', null)"
      @click="$store.commit('setSelectedElId', b.border.id)" />
    <size-arrow-tag
      v-for="b in lineBorders"
      :key="`a${b.border.id}`"
      :border="b"
      :partIndex="partIndex"
      :part="part" />
    <radius-tag v-for="b in curveBorders"
      :key="`c${b.border.id}`"
      :border="b"
      :partIndex="partIndex"
      :part="part" />
    <edges
      v-for="(b) in [...lineBorders, ...curveBorders]"
      :key="`e${b.border.id}`"
      :border="b"
      :partIndex="partIndex"
      :part="part" />
  </div>
</template>

<script>
// import $ from 'jquery';
import Victor from 'victor';
import getId from '../../mixins/getId';
import SizeArrowTag from './SizeArrowTag.vue';
import RadiusTag from './RadiusTag.vue';
import Edges from './Edges.vue';

export default {
  mixins: [getId],
  props: ['part', 'partIndex', 'curves'],
  components: { SizeArrowTag, RadiusTag, Edges },
  data() {
    return {
    };
  },
  computed: {
    selectedElId() { return this.$store.state.selectedElId; },
    currentElId() { return this.$store.state.currentElId; },
    pxPerMm() { return this.$store.state.pxPerMm; },
    borders() {
      const borders = {};
      this.part.borders.forEach((border, i) => {
        if (!(border.type in borders)) borders[border.type] = [];
        borders[border.type].push({ ...border, allBordersIndex: i });
      });
      return borders;
    },
    lineBorders() {
      if (!this.borders.lineBorder) return [];
      return this.borders.lineBorder.map((border) => {
        const prev = border.allBordersIndex ? this.part.borders[border.allBordersIndex - 1]
          : this.part.borders[this.part.borders.length - 1];
        const next = border.allBordersIndex < this.part.borders.length - 1
          ? this.part.borders[border.allBordersIndex + 1] : this.part.borders[0];
        const { type, id, points } = border;
        const config = {
          type,
          id,
          points: points.map((p) => p * this.pxPerMm),
          strokeWidth: border.skirting ? 4 : 1,
          lineCap: prev.skirting && next.skirting ? 'square' : 'butt',
          hitStrokeWidth: 5,
          allBordersIndex: border.allBordersIndex,
          isClickable: !['inset', 'bulge'].includes(border.subType),
          // isHoverable: !['inset', 'bulge'].includes(border.subType) || !border.sizeTag.isShown,
          sizeTag: border.sizeTag,
        };
        return { config, border };
      });
    },
    curveBorders() {
      if (!this.borders.curveBorder) return [];
      return this.borders.curveBorder.map((border) => {
        const prev = border.allBordersIndex ? this.part.borders[border.allBordersIndex - 1]
          : this.part.borders[this.part.borders.length - 1];
        const next = border.allBordersIndex < this.part.borders.length - 1
          ? this.part.borders[border.allBordersIndex + 1] : this.part.borders[0];
        const { type, id, points } = border;
        const c = { ...this.curves[border.id] };
        const config = {
          type,
          id,
          points: points.map((p) => p * this.pxPerMm),
          isInside: border.isInside,
          strokeWidth: border.skirting ? 4 : 1,
          lineJoin: prev.skirting && next.skirting ? 'round' : 'miter',
          hitStrokeWidth: 5,
          allBordersIndex: border.allBordersIndex,
          innerRadius: c.R,
          outerRadius: c.R,
          x: c.c1.x,
          y: c.c1.y,
          angle: c.ang2 * (180 / Math.PI) - c.ang1 * (180 / Math.PI),
          rotation: c.ang1 * (180 / Math.PI),
          clockwise: c.isInside,
          radiusTag: border.radiusTag,
        };
        return { config, border };
      });
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
  },
};
</script>
