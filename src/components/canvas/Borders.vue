<template>
  <div>
    <line-border
      v-for="(border) in borders.lineBorder"
      :key="border.id"
      :borderIndex="border.allBordersIndex"
      :partIndex="partIndex" />
    <curve-border
      v-for="border in borders.curveBorder"
      :key="border.id"
      :borderIndex="border.allBordersIndex"
      :partIndex="partIndex"
      :curves="curves" />
  </div>
</template>

<script>
import Victor from 'victor';
import toastr from 'toastr';
import getId from '../../mixins/getId';
import LineBorder from './LineBorder.vue';
import CurveBorder from './CurveBorder.vue';
import confirmModal from '../../modules/ConfirmModal';

export default {
  mixins: [getId],
  props: ['part', 'partIndex', 'curves'],
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
      } else if (data.action === 'addPoint') {
        this.addPoint(data);
      } else if (data.action === 'showRadius') {
        this.$store.commit('setRadiusTagParams', {
          i: data.partIndex,
          j: data.borderIndex,
          isShown: true,
        });
        this.$store.commit('addLog');
      }
    },
    refreshSelectedElTrigger() {
      this.$refs[`border${this.selectedElId}`][0].getNode().fire('click');
    },
    // borders: {
    //   handler() {
    //     console.log('allborders');
    //   },
    //   deep: true,
    // },
  },
  methods: {
    setContextMenuEvent(e, index) {
      const { partIndex } = this;
      this.$store.commit('setContextMenuEvent', { e, partIndex, borderIndex: index });
    },
    async makeBorderCurve(data) {
      const { points } = this.part;
      const border = this.part.borders[data.borderIndex];
      const p1 = points[border.pointsIndexes[0]].c;
      const p2 = points[border.pointsIndexes[1]].c;
      const pts = [...p1, ...p2];
      const borderLength = Math.sqrt((pts[2] - pts[0]) ** 2 + (pts[3] - pts[1]) ** 2);
      let payload = {
        body: `Введите отступ ${data.isInside ? 'вогнутой' : 'выпуклой'} от прямой`,
        title: `Сделать ${data.isInside ? 'вогнутой' : 'выпуклой'}`,
      };
      payload = {
        ...payload,
        input: {
          type: 'number',
          placeholder: `отступ в мм, максимум ${Math.ceil(borderLength / 2)}`,
        },
      };
      payload.actions = [
        { action: '0', style: 'secondary', text: 'Отмена' },
        { action: '1', style: 'primary', text: 'Применить' },
      ];
      const confirmation = await confirmModal(payload);
      if (!confirmation) return;
      const margin = parseInt(confirmation, 10);
      if (Number.isNaN(margin) || !margin || margin > borderLength / 2) {
        toastr.warning('Отступ введен неверно');
        return;
      }
      const radius = ((borderLength / 2) ** 2 + (margin ** 2)) / (2 * margin);
      this.$store.dispatch('makeBorderCurve', Object.assign(data, { radius }));
      this.$store.commit('addLog');
    },
    makeBulgeInset(data) {
      const { points } = this.part;
      const border = this.part.borders[data.borderIndex];
      const p1 = points[border.pointsIndexes[0]].c;
      const p2 = points[border.pointsIndexes[1]].c;
      const pts = [...p1, ...p2];
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
        const newBorder = { id: this.getId(), type: 'lineBorder' };
        if (index < 3) border.subType = subType;
        const newPointId = this.getId();
        const point = { id: newPointId, c: p, subType };
        this.$store.dispatch('addPoint', {
          i: partIndex,
          j: borderIndex + index + 1,
          point: { ...point, insetBulgeId },
          border: newBorder,
        });
        pointsId.push(newPointId);
      });
      const insetBulge = { partIndex, pointsId, id: insetBulgeId };
      this.$store.dispatch('addInsetBulge', { ...insetBulge, type: subType, depth });
      this.$store.commit('setSelectedElId', insetBulgeId);
      this.$store.commit('addLog');
    },
    addPoint(data) {
      const index = data.borderIndex;
      const pt1 = this.part.points[index].c;
      const pt2 = index < this.part.points.length - 1
        ? this.part.points[index + 1].c : this.part.points[0].c;
      const pt3 = [pt1[0] + (pt2[0] - pt1[0]) / 2, pt1[1] + (pt2[1] - pt1[1]) / 2];
      const { partIndex } = data;
      this.$store.dispatch('addPoint', {
        i: partIndex,
        j: index + 1,
        border: { id: this.getId(), type: 'lineBorder' },
        point: { id: this.getId(), c: pt3, addedByUser: true },
      });
      this.$store.commit('addLog');
    },
  },
};
</script>
