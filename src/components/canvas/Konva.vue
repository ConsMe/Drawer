<template>
  <div style="border: 1px solid;" class="position-relative">
    <div ref="nocontext">
      <context-menu />
      <v-stage
        :config="{width: 1200, height: 500, type: 'stage'}"
        ref="stage"
        @click="deselect">
        <v-layer>
          <part
            v-for="(part, i) in parts"
            :key="part.id"
            :partIndex="i"
            :part="part" />
        </v-layer>
      </v-stage>
    </div>
    <element-menu />
  </div>
</template>

<script>
import $ from 'jquery';
import ContextMenu from './ContextMenu.vue';
import getId from '../../mixins/getId';
import Part from './Part.vue';
import ElementMenu from '../manage/element-menu/ElementMenu.vue';

export default {
  mixins: [getId],
  components: { ContextMenu, Part, ElementMenu },
  data() {
    return {};
  },
  computed: {
    contextMenuAction() { return this.$store.state.contextMenuAction; },
    parts() { return this.$store.getters.parts; },
    canvasHeightInMm() { return this.$store.state.canvasHeightInMm; },
  },
  mounted() {
    const pxPerMm = this.$el.clientHeight / this.canvasHeightInMm;
    this.$store.commit('setPxPerMm', pxPerMm);
    const canvasWidthInMm = this.$el.clientWidth / pxPerMm;
    this.$store.commit('setCanvasWidthInMm', canvasWidthInMm);
    const widthInMm = 1000;
    const heightInMm = 2000;
    const startPoint = [
      (canvasWidthInMm - widthInMm) / 2,
      (this.canvasHeightInMm - heightInMm) / 2,
    ];
    const part = {
      id: this.getId(),
      position: { x: 0, y: 0 },
      type: 'polygon',
      points: [
        { id: this.getId(), c: startPoint },
        { id: this.getId(), c: [startPoint[0] + widthInMm, startPoint[1]] },
        { id: this.getId(), c: [startPoint[0] + widthInMm, startPoint[1] + heightInMm] },
        { id: this.getId(), c: [startPoint[0], startPoint[1] + heightInMm] },
      ],
    };
    part.borders = part.points.map(() => (
      {
        id: this.getId(),
        type: 'lineBorder',
        sizeArrow: 'outside',
        radiusPosition: 'usual',
      }
    ));
    // this.$store.commit('addPart', part);
    $(this.$refs.nocontext).on('contextmenu', (e) => e.preventDefault());
  },
  methods: {
    deselect(e) {
      if (e.target.attrs.type === 'stage') {
        this.$store.commit('setSelectedElId', null);
      }
    },
  },
};
</script>
