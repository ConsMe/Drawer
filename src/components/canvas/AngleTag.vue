<template>
  <div v-if="point.angleTag.isShown">
    <v-label
      :config="{
        ...params.textPosition,
        rotation: params.angle,
        offset: params.offset,
        draggable: true,
        dragBoundFunc: params.dragBoundFunc,
      }"
      ref="angle"
      @mouseover="over = true"
      @mouseleave="over = false"
      @contextmenu="setContextMenuEvent"
      @dragend="dragend">
      <v-tag :config="{fill: 'transparent'}" />
      <v-text :config="{
        text: params.angleText,
        fontSize,
        fontFamily: 'Calibri',
        fill: over ? selectedColor : 'black',
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
      dash,
    }" />
  </div>
</template>

<script>
import Victor from 'victor';

export default {
  props: ['point', 'partIndex', 'pointIndex'],
  data() {
    return {
      over: false,
      offsetInMm: 100,
    };
  },
  computed: {
    pxPerMm() { return this.$store.state.pxPerMm; },
    fontSize() { return this.$store.state.fontSizeInmM.radius * this.pxPerMm; },
    part() { return this.$store.state.parts.partsInit[this.partIndex]; },
    params() {
      this.console.log('angleTag', this.point.id);
      const distance = this.point.angleTag.distance || 0;
      const { borders, points } = this.part;
      const border1 = borders[this.point.bordersIndexes[0]];
      const border2 = borders[this.point.bordersIndexes[1]];
      let pts = [...points[border1.pointsIndexes[0]].c, ...this.point.c]
        .map((p) => p * this.pxPerMm);
      const startVec = new Victor(pts[2], pts[3]);
      const vec1 = new Victor(pts[0] - pts[2], pts[1] - pts[3]);
      const offsetVec = this.offsetInMm * this.pxPerMm;
      let vec = vec1.clone().norm().multiply(new Victor(offsetVec, offsetVec));
      const p1Vec = vec.add(startVec);
      pts = [...this.point.c, ...points[border2.pointsIndexes[1]].c]
        .map((p) => p * this.pxPerMm);
      const vec2 = new Victor(pts[2] - pts[0], pts[3] - pts[1]);
      vec = vec2.clone().norm().multiply(new Victor(offsetVec, offsetVec));
      const p2Vec = vec.add(startVec);
      const radius = p2Vec.clone().subtract(p1Vec).length() / 2 + 2;
      const angle1 = vec2.angleDeg();
      let angleDeg = vec1.angleDeg() - angle1;
      if (angleDeg < 0) {
        angleDeg += 360;
      }
      let isOpposite = angleDeg >= 180;
      if (this.point.angleTag.isOutside) isOpposite = !isOpposite;
      const { ang1, ang2, c1 } = this.getCurve(p1Vec.toObject(),
        p2Vec.toObject(), radius, isOpposite);
      const angleText = `${Math.round(angleDeg)} °`;
      vec = new Victor(p2Vec.x - p1Vec.x, p2Vec.y - p1Vec.y);
      const middlePoingthLength = vec.length() / 2;
      vec = vec.clone().norm()
        .multiply(new Victor(middlePoingthLength, middlePoingthLength)).add(p1Vec);
      const middlePointVec = new Victor(vec.x - c1.x, vec.y - c1.y);
      const textOffset = distance ? distance * this.pxPerMm : radius + offsetVec * 1.2;
      const originalAngle = middlePointVec.angleDeg();
      let correctAngle = this.point.angleTag.correctAngle || 0;
      if (isOpposite) correctAngle += 180;
      const textPosition = middlePointVec.clone().norm()
        .rotateDeg(correctAngle)
        .multiply(new Victor(textOffset, textOffset))
        .add(new Victor(c1.x, c1.y))
        .toObject();
      const halfFontSize = this.fontSize / 2;
      const offset = {
        x: (halfFontSize * angleText.length) / 2,
        y: halfFontSize,
      };
      const This = this;
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
        originalAngle,
        angleDeg,
        isOpposite,
        pts,
        dragBoundFunc(pos) {
          This.dragTag(pos);
          return this.absolutePosition();
        },
      };
    },
    partPosition() { return this.part.position; },
    contextMenuAction() { return this.$store.state.contextMenuAction; },
    dash() { return this.$store.state.dash; },
    selectedColor() { return this.$store.state.selectedColor; },
  },
  watch: {
    contextMenuAction(data) {
      if (data.partIndex !== this.partIndex) return;
      if (data.pointIndex !== this.pointIndex) return;
      if (data.action === 'hideAngle') {
        this.$store.commit('setAngleTagParams', {
          i: data.partIndex,
          j: data.pointIndex,
          angleTag: {},
        });
        this.$store.commit('addLog');
      }
    },
    over(over) {
      if (over) {
        this.$store.commit('setCursor', 'move');
      } else {
        this.$store.commit('resetCursor');
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
    getCurve(p1, p2, radius, isOpposite) {
      const pm = { x: 0.5 * (p1.x + p2.x), y: 0.5 * (p1.y + p2.y) };
      let perpABdx = !isOpposite ? -(p2.y - p1.y) : -(p1.y - p2.y);
      let perpABdy = !isOpposite ? p2.x - p1.x : p1.x - p2.x;
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
    dragTag(pos) {
      const { pts } = this.params;
      const x2 = pos.x;
      const y2 = pos.y;
      const x3 = this.partPosition.x;
      const y3 = this.partPosition.y;
      const vec = new Victor(x2 - (pts[0] + x3), y2 - (pts[1] + y3));
      const angle = vec.angleDeg();
      const correctAngle = angle - this.params.originalAngle;
      const distance = vec.length() / this.pxPerMm;
      this.$store.commit('setAngleTagParams', {
        i: this.partIndex,
        j: this.pointIndex,
        correctAngle: this.params.isOpposite ? correctAngle + 180 : correctAngle,
        distance,
        isShown: true,
        isOutside: this.point.angleTag.isOutside,
      });
    },
    dragend() {
      this.$refs.angle.getNode().clearCache();
      this.$store.commit('addLog');
    },
  },
};
</script>
