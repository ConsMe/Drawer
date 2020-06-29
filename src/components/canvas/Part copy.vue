<template>
  <v-group
    :config="groupConfig"
    @dragend="log">
    <v-shape :config="{
      ...partShapeConfig,
      fill: [currentElId, selectedElId].includes(partShapeConfig.id)
        ? 'rgba(0,0,0,0.2)' : '#80808054',
    }"
    @mouseover="$store.commit('setCurrentEl', partShapeConfig.id)"
    @mouseleave="$store.commit('setCurrentEl', null)" />
    <borders
      :part="part"
      :partIndex="partIndex"
      :curves="curves" />
    <points :points="part.points" :partIndex="partIndex" :part="part" />
    <insets-bulges
      :part="part"
      :partIndex="partIndex"
      v-if="part.insetsBulges && part.insetsBulges.length" />
  </v-group>
</template>

<script>
import Borders from './Borders.vue';
import Points from './Points.vue';
import InsetsBulges from './InsetsBulges.vue';

export default {
  props: ['partIndex', 'part'],
  data() {
    return {
    };
  },
  components: { Borders, Points, InsetsBulges },
  computed: {
    selectedElId() { return this.$store.state.selectedElId; },
    currentElId() { return this.$store.state.currentElId; },
    curves() {
      const curves = {};
      this.part.borders.forEach((border) => {
        if (border.type !== 'curveBorder') return;
        const radius = border.radiusInPx;
        const points = border.pointsInPx;
        const p1 = { x: points[0], y: points[1] };
        const p2 = { x: points[2], y: points[3] };
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
    partShapeConfig() {
      const { points, borders } = this.part;
      const { curves } = this;
      return {
        id: this.part.id,
        sceneFunc(ctx, shape) {
          ctx.beginPath();
          ctx.moveTo(...points[0].cInPx);
          points.forEach((point, i) => {
            if (borders[i].type === 'lineBorder') {
              ctx.lineTo(...point.cInPx);
            } else if (borders[i].type === 'curveBorder') {
              const c = curves[borders[i].id];
              ctx.arc(c.c1.x, c.c1.y, c.R, c.ang1, c.ang2, c.isInside);
            }
          });
          ctx.fillStrokeShape(shape);
        },
      };
    },
    otherPartsBB() {
      return this.$store.getters.boundingBoxes.filter((bb) => bb.id !== this.part.id);
    },
    groupConfig() {
      const bb = this.otherPartsBB;
      const { width, height } = this.$store.getters.boundingBoxes[this.partIndex];
      const halfWidth = width / 2;
      const halfHeight = height / 2;
      let block = null;
      return {
        draggable: true,
        dragBoundFunc(pos) {
          let newPos = pos;
          if (bb.length) {
            const x1 = pos.x - halfWidth;
            const x2 = pos.x + halfWidth;
            const y1 = pos.y - halfHeight;
            const y2 = pos.y + halfHeight;
            bb.some((b) => {
              if ((x1 < b.x2 && x2 > b.x1) && (y1 >= b.y2 || y2 <= b.y1)) {
                block = 'y';
              } else if ((x1 >= b.x2 || x2 <= b.x1) && (y1 < b.y2 && y2 > b.y1)) {
                block = 'x';
              } else if ((x1 < b.x2 && x2 > b.x1) && (y1 < b.y2 && y2 > b.y1)) {
                let { x, y } = newPos;
                if (block === 'x') {
                  x = x1 < b.x2 && x > b.x2 ? b.x2 + b.width / 2 : b.x1 - b.width / 2;
                } else if (block === 'y') {
                  y = y1 < b.y2 ? b.y2 : b.y1;
                }
                newPos = { x, y };
                return false;
              }
              return false;
            });
          }
          return newPos;
        },
      };
    },
  },
  methods: {
    log(e) {
      // console.log(e);
      // console.log(e.target.getPosition());
      this.setPartPosition(e.target.getPosition());
    },
    setPartPosition(pos) {
      this.$store.commit('setPartPosition', { i: this.partIndex, pos });
    },
  },
};
</script>
