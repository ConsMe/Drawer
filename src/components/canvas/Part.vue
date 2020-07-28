<template>
  <div>
    <v-group
      :config="groupConfig"
      @dragend="log">
      <v-shape :config="{
        ...partShapeConfig,
        fill: fill.color,
        fillPatternImage: fill.image,
        fillPriority: 'pattern',
      }"
      ref="shape"
      @mouseover="$store.commit('setCurrentEl', part.id)"
      @mouseleave="$store.commit('setCurrentEl', null)"
      @click="$store.commit('setSelectedElId', part.id)"
      @contextmenu="setContextMenuEvent" />
      <inset-bulge
        v-for="(ib, index) in part.insetsBulges"
        :key="ib.id"
        :partIndex="partIndex"
        :iBIndex="index" />
      <borders
        :part="part"
        :partIndex="partIndex"
        :curves="curves" />
      <p-point
        v-for="(point, index) in points"
        :key="point.id"
        :pointIndex="index"
        :partIndex="partIndex" />
      <single-size-tag
        v-for="(sizeTag, index) in part.singleSizeTags"
        :key="sizeTag.id"
        :partIndex="partIndex"
        :sizeTagIndex="index"  />
      <washing
        v-for="(washing, index) in part.washings"
        :key="washing.id"
        :partIndex="partIndex"
        :washingIndex="index"  />
    </v-group>
  </div>
</template>

<script>
import Borders from './Borders.vue';
import PPoint from './Point.vue';
import InsetBulge from './InsetBulge.vue';
import fills from '../../modules/fills';
import SingleSizeTag from './SingleSizeTag.vue';
import Washing from './Washing.vue';
import getId from '../../mixins/getId';

export default {
  mixins: [getId],
  props: ['partIndex', 'part'],
  data() {
    return {
    };
  },
  components: {
    Borders,
    PPoint,
    InsetBulge,
    SingleSizeTag,
    Washing,
  },
  computed: {
    selectedElId() { return this.$store.state.selectedElId; },
    currentElId() { return this.$store.state.currentElId; },
    pxPerMm() { return this.$store.state.pxPerMm; },
    curveBorders() {
      return this.part.borders.filter((b) => b.type === 'curveBorder')
        .map((b) => (
          {
            pointsIndexes: b.pointsIndexes,
            isInside: b.isInside,
            id: b.id,
            radius: b.radius,
          }));
    },
    curves() {
      const curves = {};
      // console.log('curves', this.part.id);
      const { points } = this.part;
      this.curveBorders.forEach((border) => {
        const radius = border.radius * this.pxPerMm;
        const coords1 = points[border.pointsIndexes[0]].c.map((a) => a * this.pxPerMm);
        const coords2 = points[border.pointsIndexes[1]].c.map((a) => a * this.pxPerMm);
        const p1 = { x: coords1[0], y: coords1[1] };
        const p2 = { x: coords2[0], y: coords2[1] };
        const pm = { x: 0.5 * (p1.x + p2.x), y: 0.5 * (p1.y + p2.y) };
        let perpABdx = -(p2.y - p1.y);
        let perpABdy = p2.x - p1.x;
        const norm = Math.sqrt(perpABdx ** 2 + perpABdy ** 2);
        perpABdx /= norm;
        perpABdy /= norm;
        const dpmp1 = Math.sqrt((pm.x - p1.x) ** 2 + (pm.y - p1.y) ** 2);
        const sin = dpmp1 / radius;
        if (sin < -1 || sin > 1) return;
        const cos = Math.sqrt(1 - (sin) ** 2);
        const d = radius * cos;
        const res1 = { x: pm.x + perpABdx * d, y: pm.y + perpABdy * d };
        const res2 = { x: pm.x - perpABdx * d, y: pm.y - perpABdy * d };
        const ang1 = Math.atan2(p1.y - res1.y, p1.x - res1.x);
        const ang2 = Math.atan2(p2.y - res1.y, p2.x - res1.x);
        const p1p2Length = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
        const p1p2Cos = (p2.x - p1.x) / p1p2Length;
        const p1p2Angle = Math.acos(p1p2Cos);
        const diffY = p1.x > p2.x ? p1.y - p2.y : p2.y - p1.y;
        const m = diffY > 0 ? -1 : 1;
        curves[border.id] = {
          c1: border.isInside ? res2 : res1,
          p1,
          p2,
          R: radius,
          ang1: border.isInside ? (Math.PI + Math.abs(1.57 - p1p2Angle) * 2 * m) - ang1 : ang1,
          ang2: border.isInside ? (Math.PI + Math.abs(1.57 - p1p2Angle) * 2 * m) - ang2 : ang2,
          isInside: border.isInside,
        };
      });
      return curves;
    },
    points() {
      return this.part.points.map((p) => p.c.map((c) => c * this.pxPerMm));
    },
    borders() {
      return this.part.borders.map((border) => (
        {
          type: border.type,
          id: border.id,
        }
      ));
    },
    partShapeConfig() {
      this.console.log('partShape', this.part.id);
      const { type, id } = this.part;
      const { points, curves, borders } = this;
      return {
        type,
        id,
        sceneFunc(ctx, shape) {
          ctx.beginPath();
          ctx.moveTo(...points[0]);
          points.forEach((point, i) => {
            if (borders[i].type === 'lineBorder') {
              ctx.lineTo(...point);
            } else if (borders[i].type === 'curveBorder') {
              const c = curves[borders[i].id];
              ctx.arc(c.c1.x, c.c1.y, c.R, c.ang1, c.ang2, c.isInside);
            }
          });
          ctx.fillStrokeShape(shape);
        },
      };
    },
    myBB() {
      const { part } = this;
      const xs = part.points.map((p) => p.c[0] * this.pxPerMm);
      const ys = part.points.map((p) => p.c[1] * this.pxPerMm);
      const bb = {
        id: part.id,
        absolute: {
          x1: Math.min(...xs),
          x2: Math.max(...xs),
          y1: Math.min(...ys),
          y2: Math.max(...ys),
        },
      };
      bb.relative = {
        x1: bb.absolute.x1 + part.position.x,
        x2: bb.absolute.x2 + part.position.x,
        y1: bb.absolute.y1 + part.position.y,
        y2: bb.absolute.y2 + part.position.y,
      };
      bb.width = Math.abs(bb.absolute.x2 - bb.absolute.x1);
      bb.height = Math.abs(bb.absolute.y2 - bb.absolute.y1);
      return bb;
    },
    otherPartsBB() {
      return this.$store.state.parts.boundingBoxes
        .filter((b) => b.id !== this.part.id);
    },
    groupConfig() {
      const bb = this.otherPartsBB;
      const my = this.myBB.absolute;
      const isLimitMoving = false;
      let block = null;
      const config = {
        type: 'part',
        draggable: true,
        dragBoundFunc(pos) {
          if (!isLimitMoving) return pos;
          // console.log(pos);
          const newPos = pos;
          if (bb.length) {
            const x1 = my.x1 + pos.x;
            const x2 = my.x2 + pos.x;
            const y1 = my.y1 + pos.y;
            const y2 = my.y2 + pos.y;
            const isBlock = bb.some((bBox) => {
              const b = bBox.relative;
              if (x1 >= b.x2 || x2 <= b.x1) return false;
              if (y1 >= b.y2 || y2 <= b.y1) return false;
              const diff = { x: 0, y: 0 };
              diff.x = x2 > b.x2 ? b.x2 - x1 : x2 - b.x1;
              diff.y = y2 > b.y2 ? b.y2 - y1 : y2 - b.y1;
              if (diff.x < diff.y && (block === null || block === 'x')) {
                newPos.x = x2 >= b.x2 ? b.x2 - my.x1 : b.x1 - my.x2;
                block = 'x';
              } else {
                newPos.y = y2 >= b.y2 ? b.y2 - my.y1 : b.y1 - my.y2;
                block = 'y';
              }
              return true;
            });
            block = isBlock ? block : null;
          }
          return newPos;
        },
      };
      if (this.part.position) {
        Object.assign(config, { ...this.part.position });
      }
      return config;
    },
    fill() {
      const { fill } = this.$store.state.parts.partsInit[this.partIndex];
      const fillParams = { color: 'white', image: null };
      if (!fill) return fillParams;
      if (fill === 'color') {
        fillParams.color = 'rgb(200,200,200)';
      } else {
        fillParams.image = fills({ type: fill, color: 'rgb(200,200,200)' });
      }
      return fillParams;
    },
    contextMenuAction() { return this.$store.state.contextMenuAction; },
  },
  watch: {
    contextMenuAction(data) {
      if (data.partIndex !== this.partIndex) return;
      if (data.action === 'deletePart') {
        setTimeout(() => {
          this.$store.commit('deletePart', data.partIndex);
          this.$store.commit('addLog');
        }, 0);
      } else if (data.action === 'addSingleSizeTag') {
        const params = {
          points: [
            this.part.points[0].c[0],
            this.part.points[0].c[1] - 500,
            this.part.points[0].c[0] + 500,
            this.part.points[0].c[1] - 500,
          ],
          id: this.getId(),
          i: data.partIndex,
          type: 'singleSizeTag',
        };
        this.$store.commit('addSingleSizeTag', params);
        this.$store.commit('addLog');
      }
    },
    myBB: {
      handler(bb) {
        this.$store.commit('setBoundingBox', { i: this.partIndex, bb });
      },
      immediate: true,
    },
    // partShapeConfig: {
    //   handler() {
    //     // console.log('curveBorders');
    //     this.$refs.shape.getNode().cache();
    //     console.log('cached');
    //   },
    //   // deep: true,
    //   // immediate: true,
    // },
  },
  methods: {
    log(e) {
      if (e.target.attrs.type !== 'part') return;
      this.setPartPosition(e.target.getPosition());
    },
    setPartPosition(pos) {
      this.$store.commit('setPartPosition', { i: this.partIndex, pos });
      this.$store.commit('addLog');
    },
    setContextMenuEvent(e) {
      const { partIndex } = this;
      this.$store.commit('setContextMenuEvent', { e, partIndex });
    },
  },
};
</script>
