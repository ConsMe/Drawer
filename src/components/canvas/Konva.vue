<template>
  <div style="border: 1px solid; margin-bottom: 300px;" class="position-relative">
    <div ref="nocontext">
      <context-menu />
      <v-stage
        :config="{
          width: canvasWidthInPx,
          height: 500,
          type: 'stage',
        }"
        ref="stage">
        <v-layer>
          <v-rect
            :config="{
              width: canvasWidthInPx,
              height: 500,
              fill: 'white',
              type: 'bgRect'
            }"
            @click="deselect" />
          <part
            v-for="(part, i) in parts"
            :key="part.id"
            :partIndex="i"
            :part="part" />
          <total-text
            v-for="(text, i) in totalTexts"
            :key="text.id"
            :textIndex="i"
            :text="text" />
          <legends
            v-for="(legend, index) in legends"
            :key="legend.id"
            :legend="legend"
            :legendIndex="index" />
        </v-layer>
      </v-stage>
    </div>
    <element-menu />
    <logs />
    <text-edit />
    <add-washing :trigger="addWashingTrigger" />
  </div>
</template>

<script>
import $ from 'jquery';
import ContextMenu from './ContextMenu.vue';
import getId from '../../mixins/getId';
import Part from './Part.vue';
import ElementMenu from '../manage/element-menu/ElementMenu.vue';
import Logs from '../manage/Logs.vue';
import TextEdit from '../manage/TextEdit.vue';
import TotalText from './TotalText.vue';
import Legends from './Legend.vue';
import AddWashing from '../manage/add-menu/AddWashing.vue';

export default {
  mixins: [getId],
  components: {
    ContextMenu, Part, ElementMenu, Logs, TextEdit, TotalText, Legends, AddWashing,
  },
  data() {
    return {
      content: '',
      editorOptions: {
        placeholder: 'Введите текст',
      },
      addWashingTrigger: {},
    };
  },
  computed: {
    contextMenuAction() { return this.$store.state.contextMenuAction; },
    parts() { return this.$store.state.parts.partsInit; },
    totalTexts() { return this.$store.state.parts.totalTexts; },
    legends() { return this.$store.state.parts.legends; },
    canvasHeightInMm() { return this.$store.state.canvasHeightInMm; },
    canvasWidthInMm() { return this.$store.state.canvasWidthInMm; },
    canvasWidthInPx() {
      return this.canvasWidthInMm ? this.canvasWidthInMm * this.pxPerMm : 0;
    },
    pxPerMm() { return this.$store.state.pxPerMm; },
    cursor() { return this.$store.state.cursor; },
    selectedEl() { return this.$store.getters.selectedEl; },
  },
  watch: {
    cursor(cursor) {
      this.$refs.stage.getNode().container().style.cursor = cursor;
    },
    contextMenuAction(data) {
      if (data.action === 'addWashing') {
        const { position } = this.parts[data.partIndex];
        this.addWashingTrigger = { ...data, partPosition: position || { x: 0, y: 0 } };
      }
    },
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
      fill: null,
      type: 'part',
      insetsBulges: [],
      texts: [],
      singleSizeTags: [],
      washings: [],
      points: [
        { id: this.getId(), c: startPoint, angleTag: {} },
        { id: this.getId(), c: [startPoint[0] + widthInMm, startPoint[1]], angleTag: {} },
        {
          id: this.getId(),
          c: [startPoint[0] + widthInMm, startPoint[1] + heightInMm],
          angleTag: {},
        },
        { id: this.getId(), c: [startPoint[0], startPoint[1] + heightInMm], angleTag: {} },
      ],
    };
    part.borders = part.points.map(() => (
      {
        id: this.getId(),
        type: 'lineBorder',
        sizeTag: { isShown: true },
        radiusPosition: 'usual',
      }
    ));
    this.$store.dispatch('addPart', part);
    this.$store.commit('addLog');
    $(this.$refs.nocontext).on('contextmenu', (e) => e.preventDefault());
    this.$store.commit('setStage', this.$refs.stage.getNode());
    window.addEventListener('keypress', (e) => {
      if (e.code !== 'Delete' || !this.selectedEl.el) return;
      let action;
      switch (this.selectedEl.el.type) {
        case 'part':
          action = { action: 'deletePart', partIndex: this.selectedEl.i };
          break;
        case 'totalText':
          action = { action: 'deleteTotalText', textIndex: this.selectedEl.i };
          break;
        default:
          return;
      }
      this.$store.commit('setContextMenuAction', action);
    });
  },
  methods: {
    deselect(e) {
      if (e.target.attrs.type === 'bgRect') {
        this.$store.commit('setSelectedElId', null);
      }
    },
  },
};
</script>
