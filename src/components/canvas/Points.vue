<template>
  <div>
    <v-circle
      v-for="(point, index) in allPoints"
      :key="point.id"
      :config="{
        type: 'point',
        x: point.cInPx[0],
        y: point.cInPx[1],
        radius,
        fill: [currentElId, selectedElId].includes(point.id)
          ? selectedColor : 'transparent',
        angleTag: point.angleTag,
        isInsetBulge: !!point.insetBulgeId,
      }"
      @mouseover="point.isClickable ? $store.commit('setCurrentEl', point.id) : ''"
      @mouseleave="point.isClickable ? $store.commit('setCurrentEl', null) : ''"
      @dragmove="movePoint($event, index)"
      @click="point.isClickable ? $store.commit('setSelectedElId', point.id) : ''"
      @contextmenu="point.isClickable ? setContextMenuEvent($event, index) : ''">
    </v-circle>
    <angle-tag
      v-for="(point, index) in allPoints"
      :key="`a${point.id}`"
      :partIndex="partIndex"
      :point="point"
      :pointIndex="index"
      :part="part" />
  </div>
</template>

<script>
import Victor from 'victor';
import toastr from 'toastr';
import getId from '../../mixins/getId';
import AngleTag from './AngleTag.vue';
import confirmModal from '../../modules/ConfirmModal';

export default {
  mixins: [getId],
  components: { AngleTag },
  props: ['points', 'partIndex', 'part'],
  computed: {
    selectedElId() { return this.$store.state.selectedElId; },
    currentElId() { return this.$store.state.currentElId; },
    contextMenuAction() { return this.$store.state.contextMenuAction; },
    pxPerMm() { return this.$store.state.pxPerMm; },
    radius() { return 60 * this.pxPerMm; },
    allPoints() {
      return this.points.map((point) => {
        const pt = {
          ...point,
          // isClickable: !['inset', 'bulge'].includes(point.subType),
          isClickable: true,
        };
        return pt;
      });
    },
    selectedColor() { return this.$store.state.selectedColor; },
  },
  watch: {
    contextMenuAction(data) {
      if (data.partIndex !== this.partIndex) return;
      this.$store.commit('setContextMenuEvent', null);
      if (data.action === 'addPoint') {
        this.addPoint(data);
      } else if (data.action === 'deletePoint') {
        this.deletePoint(data);
      } else if (data.action === 'makeCorderCut') {
        this.makeCorderCut(data);
      } else if (data.action === 'makeRounded') {
        this.makeRounded(data);
      }
    },
  },
  methods: {
    setContextMenuEvent(e, index) {
      const { partIndex } = this;
      this.$store.commit('setContextMenuEvent', { e, partIndex, pointIndex: index });
    },
    movePoint(event, pointIndex) {
      const { partIndex } = this;
      const c = Object.values(event.target.position()).map((pc) => pc / this.pxPerMm);
      this.$store.commit('movePoint', { pointIndex, partIndex, c });
    },
    addPoint(data) {
      const index = data.borderIndex;
      const pt1 = this.part.points[index].c;
      const pt2 = index < this.part.points.length - 1
        ? this.part.points[index + 1].c : this.part.points[0].c;
      const pt3 = [pt1[0] + (pt2[0] - pt1[0]) / 2, pt1[1] + (pt2[1] - pt1[1]) / 2];
      const { partIndex } = data;
      this.$store.commit('addBorder', {
        partIndex,
        borderIndex: index + 1,
        border: { id: this.getId(), type: 'lineBorder' },
      });
      this.$store.commit('addPoint', { partIndex, pointIndex: index + 1, point: { id: this.getId(), c: pt3 } });
      this.$store.commit('addLog');
    },
    deletePoint(data) {
      this.$store.commit('deletePoint', data);
      this.$store.commit('addLog');
    },
    makeCorderCut(data) {
      const { pointIndex, partIndex } = data;
      const point = this.points[pointIndex];
      const prev = pointIndex ? this.points[pointIndex - 1] : this.points[this.points.length - 1];
      const newPoints = [];
      const depth = 300;
      let startVec = new Victor(point.c[0], point.c[1]);
      let vec = new Victor(prev.c[0] - point.c[0], prev.c[1] - point.c[1]);
      vec = vec.norm().multiply(new Victor(depth, depth));
      startVec = vec.clone().add(startVec);
      newPoints.push(startVec.toObject());
      vec = vec.norm().rotateDeg(-90).multiply(new Victor(depth, depth));
      startVec = vec.clone().add(startVec);
      newPoints.push(startVec.toArray());
      vec = vec.norm().rotateDeg(-90).multiply(new Victor(depth, depth));
      startVec = vec.clone().add(startVec);
      newPoints.push(startVec.toArray());
      newPoints.forEach((p, index) => {
        if (!index) {
          const payload = { i: partIndex, j: pointIndex, point: p };
          this.$store.dispatch('changePoint', payload);
          return;
        }
        const border = { id: this.getId(), type: 'lineBorder', sizeTag: { isShown: true } };
        this.$store.commit('addBorder', {
          partIndex,
          borderIndex: pointIndex + index,
          border,
        });
        const newPointId = this.getId();
        this.$store.commit('addPoint', {
          partIndex,
          pointIndex: pointIndex + index,
          point: { id: newPointId, c: p },
        });
      });
      this.$store.commit('addLog');
    },
    async makeRounded(data) {
      let payload = { body: 'Введите радиус', title: 'Закруглить угол' };
      payload = { ...payload, input: { type: 'number', placeholder: 'радиус в мм' } };
      payload.actions = [
        { action: '0', style: 'secondary', text: 'Отмена' },
        { action: '1', style: 'primary', text: 'Применить' },
      ];
      const confirmation = await confirmModal(payload);
      if (!confirmation) return;
      const radius = parseInt(confirmation, 10);
      if (Number.isNaN(radius)) {
        toastr.warning('Радиус введен неверно');
      }
      const j2 = data.pointIndex;
      const j1 = j2 > 0 ? j2 - 1 : this.points.length - 1;
      const border1 = this.part.borders[j1];
      const pts1 = border1.points;
      const border2 = this.part.borders[j2];
      const pts2 = border2.points;
      const startVec = new Victor(pts1[2], pts1[3]);
      const vec1 = new Victor(pts1[0] - pts1[2], pts1[1] - pts1[3]);
      const newPoint1 = vec1.norm().multiply(new Victor(radius, radius)).add(startVec).toArray();
      const vec2 = new Victor(pts2[2] - pts2[0], pts2[3] - pts2[1]);
      const newPoint2 = vec2.norm().multiply(new Victor(radius, radius)).add(startVec).toArray();
      const { partIndex, pointIndex } = data;
      this.$store.commit('addBorder', {
        partIndex,
        borderIndex: j2 + 1,
        border: { id: this.getId(), type: 'lineBorder' },
      });
      this.$store.commit('addPoint', {
        partIndex,
        pointIndex: j2 + 1,
        point: { id: this.getId(), c: newPoint2 },
      });
      this.$store.commit('movePoint', { pointIndex, partIndex, c: newPoint1 });
      const params = { borderIndex: j2, radius, isInside: false };
      this.$store.dispatch('makeBorderCurve', { ...params, partIndex });
      this.$store.commit('addLog');
    },
  },
};
</script>
