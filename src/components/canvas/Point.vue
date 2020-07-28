<template>
  <div>
    <v-circle
      :config="{
        type: 'point',
        x: point.c[0] * pxPerMm,
        y: point.c[1] * pxPerMm,
        radius,
        fill: [currentElId, selectedElId].includes(point.id)
          ? selectedColor : 'transparent',
        //angleTag: point.angleTag,
        //isInsetBulge: !!point.insetBulgeId,
      }"
      @mouseover="$store.commit('setCurrentEl', point.id)"
      @mouseleave="$store.commit('setCurrentEl', null)"
      @dragmove="movePoint($event, pointIndex)"
      @click="$store.commit('setSelectedElId', point.id)"
      @contextmenu="setContextMenuEvent($event, pointIndex)">
    </v-circle>
    <v-circle
      :config="{
        x: point.c[0] * pxPerMm,
        y: point.c[1] * pxPerMm,
        radius: 2,
        fill: 'black',
      }"
      v-if="point.addedByUser"
      >
    </v-circle>
    <angle-tag
      v-if="point.angleTag && point.angleTag.isShown"
      :partIndex="partIndex"
      :point="point"
      :pointIndex="pointIndex" />
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
  props: ['partIndex', 'pointIndex'],
  computed: {
    selectedElId() { return this.$store.state.selectedElId; },
    currentElId() { return this.$store.state.currentElId; },
    contextMenuAction() { return this.$store.state.contextMenuAction; },
    part() { return this.$store.state.parts.partsInit[this.partIndex]; },
    point() { return this.part.points[this.pointIndex]; },
    pxPerMm() { return this.$store.state.pxPerMm; },
    radius() { return 60 * this.pxPerMm; },
    selectedColor() { return this.$store.state.selectedColor; },
  },
  watch: {
    contextMenuAction(data) {
      if (data.partIndex !== this.partIndex || data.pointIndex !== this.pointIndex) return;
      if (data.action === 'deletePoint') {
        this.deletePoint(data);
      } else if (data.action === 'makeCorderCut') {
        this.makeCorderCut(data);
      } else if (data.action === 'makeRounded') {
        this.makeRounded(data);
      } else if (data.action === 'showAngle') {
        this.showAngle(data);
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
    deletePoint(data) {
      const { partIndex, pointIndex } = data;
      this.$store.dispatch('deletePoint', { i: partIndex, j: pointIndex });
      this.$store.commit('addLog');
    },
    makeCorderCut(data) {
      const { pointIndex, partIndex } = data;
      const { points } = this.part;
      const prev = pointIndex ? points[pointIndex - 1] : points[this.points.length - 1];
      const newPoints = [];
      const depth = 300;
      let startVec = new Victor(this.point.c[0], this.point.c[1]);
      let vec = new Victor(prev.c[0] - this.point.c[0], prev.c[1] - this.point.c[1]);
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
        const border = { id: this.getId(), type: 'lineBorder' };
        const newPointId = this.getId();
        this.$store.dispatch('addPoint', {
          i: partIndex,
          j: pointIndex + index,
          border,
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
      const { points } = this.part;
      const j2 = data.pointIndex;
      const j1 = j2 > 0 ? j2 - 1 : points.length - 1;
      const border1 = this.part.borders[j1];
      const pts1 = [...points[border1.pointsIndexes[0]].c, ...this.point.c];
      const border2 = this.part.borders[j2];
      const pts2 = [...this.point.c, ...points[border2.pointsIndexes[1]].c];
      const startVec = new Victor(pts1[2], pts1[3]);
      const vec1 = new Victor(pts1[0] - pts1[2], pts1[1] - pts1[3]);
      const newPoint1 = vec1.norm().multiply(new Victor(radius, radius)).add(startVec).toArray();
      const vec2 = new Victor(pts2[2] - pts2[0], pts2[3] - pts2[1]);
      const newPoint2 = vec2.norm().multiply(new Victor(radius, radius)).add(startVec).toArray();
      const { partIndex, pointIndex } = data;
      this.$store.dispatch('addPoint', {
        i: partIndex,
        j: j2 + 1,
        border: { id: this.getId(), type: 'lineBorder' },
        point: { id: this.getId(), c: newPoint2 },
      });
      this.$store.commit('movePoint', { pointIndex, partIndex, c: newPoint1 });
      const params = { borderIndex: j2, radius, isInside: false };
      this.$store.dispatch('makeBorderCurve', { ...params, partIndex });
      this.$store.commit('addLog');
    },
    showAngle(data) {
      const angleTag = { isShown: true, isOutside: false };
      this.$store.commit('setAngleTagParams', {
        i: data.partIndex,
        j: data.pointIndex,
        ...angleTag,
      });
      this.$store.commit('addLog');
    },
  },
};
</script>
