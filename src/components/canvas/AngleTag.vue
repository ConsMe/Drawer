<template>
  <div v-if="point.angleTag">
    <v-label
      :config="{
        ...params.textPosition,
        rotation: params.angle,
        offset: params.offset,
      }"
      @mouseover="over = true"
      @mouseleave="over = false"
      @contextmenu="setContextMenuEvent">
      <v-tag :config="{fill: 'transparent'}" />
      <v-text :config="{
        text: params.angleText,
        fontSize,
        fontFamily: 'Calibri',
        fill: over ? 'red' : 'black',
        type: 'angleTag',
      }" />
    </v-label>
    <v-arc :config="{
      stroke: 'black',
      strokeWidth: 1,
      innerRadius: params.radius,
      outerRadius: params.radius,
      x: params.c1.x,
      y: params.c1.y,
      angle: params.ang2 * (180 / Math.PI) - params.ang1 * (180 / Math.PI),
      rotation: params.ang1 * (180 / Math.PI),
      clockwise: true,
    }" />
  </div>
</template>

<script>
import Victor from 'victor';

export default {
  props: ['point', 'partIndex', 'pointIndex', 'part'],
  data() {
    return {
      over: false,
      offsetInMm: 100,
    };
  },
  computed: {
    pxPerMm() { return this.$store.state.pxPerMm; },
    fontSize() { return this.$store.state.fontSizeInmM.radius * this.pxPerMm; },
    params() {
      const border1 = this.part.borders.find((b) => b.id === this.point.bordersId[1]);
      const border2 = this.part.borders.find((b) => b.id === this.point.bordersId[0]);
      let pts = border1.pointsInPx;
      const startVec = new Victor(pts[2], pts[3]);
      const vec1 = new Victor(pts[0] - pts[2], pts[1] - pts[3]);
      const offsetVec = this.offsetInMm * this.pxPerMm;
      let vec = vec1.clone().norm().multiply(new Victor(offsetVec, offsetVec));
      const p1Vec = vec.add(startVec);
      pts = border2.pointsInPx;
      const vec2 = new Victor(pts[2] - pts[0], pts[3] - pts[1]);
      vec = vec2.clone().norm().multiply(new Victor(offsetVec, offsetVec));
      const p2Vec = vec.add(startVec);
      const radius = p2Vec.clone().subtract(p1Vec).length() / 2 + 2;
      const { ang1, ang2, c1 } = this.getCurve(p1Vec.toObject(), p2Vec.toObject(), radius);
      const angleRad = Math.acos((vec1.dot(vec2)) / (vec1.length() * vec2.length()));
      const angleText = `${Math.round(angleRad * (180 / Math.PI))} °`;
      vec = new Victor(p2Vec.x - p1Vec.x, p2Vec.y - p1Vec.y);
      const middlePoingthLength = vec.length() / 2;
      vec = vec.clone().norm()
        .multiply(new Victor(middlePoingthLength, middlePoingthLength)).add(p1Vec);
      const middlePointVec = new Victor(vec.x - c1.x, vec.y - c1.y);
      const textOffset = radius + offsetVec * 1.2;
      const textPosition = middlePointVec.clone().norm()
        .multiply(new Victor(textOffset, textOffset))
        .add(new Victor(c1.x, c1.y))
        .toObject();
      const halfFontSize = this.fontSize / 2;
      const offset = {
        x: (halfFontSize * angleText.length) / 2,
        y: halfFontSize,
      };
      return {
        padding: 0,
        textPosition,
        angle: 0,
        offset,
        angleText,
        ang1,
        ang2,
        radius,
        c1,
      };
    },
    contextMenuAction() { return this.$store.state.contextMenuAction; },
  },
  watch: {
    contextMenuAction(data) {
      if (data.partIndex !== this.partIndex) return;
      if (data.pointIndex !== this.pointIndex) return;
      if (['hide', 'showAngle'].includes(data.action)) {
        let angleTag;
        if (data.action === 'hide') {
          angleTag = false;
        } else if (data.action === 'showAngle') {
          angleTag = { x: 0, y: 0 };
        }
        this.$store.commit('showHideAngle', {
          i: data.partIndex,
          j: data.pointIndex,
          angleTag,
        });
      }
    },
  },
  methods: {
    setContextMenuEvent(e) {
      const { partIndex, pointIndex } = this;
      this.$store.commit('setContextMenuEvent', {
        e,
        partIndex,
        pointIndex,
      });
    },
    getCurve(p1, p2, radius) {
      const pm = { x: 0.5 * (p1.x + p2.x), y: 0.5 * (p1.y + p2.y) };
      let perpABdx = -(p2.y - p1.y);
      let perpABdy = p2.x - p1.x;
      const norm = Math.sqrt(perpABdx ** 2 + perpABdy ** 2);
      perpABdx /= norm;
      perpABdy /= norm;
      const dpmp1 = Math.sqrt((pm.x - p1.x) ** 2 + (pm.y - p1.y) ** 2);
      const sin = dpmp1 / radius;
      if (sin < -1 || sin > 1) return {};
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
      return {
        c1: res2,
        p1,
        p2,
        R: radius,
        ang1: (Math.PI + Math.abs(1.57 - p1p2Angle) * 2 * m) - ang1,
        ang2: (Math.PI + Math.abs(1.57 - p1p2Angle) * 2 * m) - ang2,
      };
    },
  },
};
</script>
