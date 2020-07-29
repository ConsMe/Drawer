/* eslint-disable global-require */
import Vue from 'vue';
import Vuex from 'vuex';
import PartsModule from './parts';

Vue.use(Vuex);
const clone = (a) => JSON.parse(JSON.stringify(a));

export default new Vuex.Store({
  state: {
    stage: null,
    canvasHeightInMm: 4000,
    pxPerMm: 0,
    contextMenuEvent: null,
    cursor: 'default',
    contextMenuAction: {},
    selectedElId: null,
    currentElId: null,
    id: 0,
    fontSizeInmM: {
      sizeArrow: 90,
      radius: 90,
      text: 90,
    },
    files: { edges: {}, fills: {}, washings: {} },
    logs: [{ parts: [], totalTexts: [], legends: [] }],
    logStep: 0,
    dash: [1, 2],
    selectedColor: '#536dfe',
    isTextEditMode: false,
    showAllConsoleLogs: false,
    fills: [
      { type: 'color', title: 'Цвет' },
      { type: 'dots', title: 'Точки' },
      { type: 'verticalLines', title: 'Вертикальные линии' },
      { type: 'horizontalLines', title: 'Горизонтальные линии' },
      { type: 'rightDiagonalLines', title: 'Правый штрих' },
      { type: 'leftDiagonalLines', title: 'Левый штрих' },
      { type: 'rightSmallDiagonalLines', title: 'Мелкий штрих' },
      { type: 'rhombus', title: 'Ромб' },
    ],
  },
  getters: {
    gridSize() { return 10; },
  },
  mutations: {
    setStage(state, stage) { state.stage = stage; },
    setPxPerMm(state, pxPerMm) { state.pxPerMm = pxPerMm; },
    setCanvasWidthInMm(state, width) { Vue.set(state, 'canvasWidthInMm', width); },
    setContextMenuEvent(state, payload) { state.contextMenuEvent = payload; },
    setContextMenuAction(state, payload) { state.contextMenuAction = payload; },
    setSelectedElId(state, id) { state.selectedElId = id; },
    setCurrentEl(state, id) { state.currentElId = id; },
    incrementId(state) { state.id += 1; },
    addFile(state, file) {
      Vue.set(state.files[file.type], file.name, file.image);
    },
    setCursor(state, cursor) { state.cursor = cursor; },
    resetCursor(state) { state.cursor = 'default'; },
    addLog(state) {
      state.logStep += 1;
      state.logs[state.logStep] = {
        parts: clone(state.parts.partsInit),
        totalTexts: clone(state.parts.totalTexts),
        legends: clone(state.parts.legends),
      };
      state.logs.splice(state.logStep + 1);
    },
    logBack(state) {
      state.selectedElId = null;
      state.contextMenuEvent = null;
      state.parts.partsInit = clone(state.logs[state.logStep - 1].parts);
      state.parts.totalTexts = clone(state.logs[state.logStep - 1].totalTexts);
      state.parts.legends = clone(state.logs[state.logStep - 1].legends);
      state.logStep -= 1;
    },
    logForward(state) {
      state.selectedElId = null;
      state.contextMenuEvent = null;
      state.logStep += 1;
      state.parts.partsInit = clone(state.logs[state.logStep].parts);
      state.parts.totalTexts = clone(state.logs[state.logStep].totalTexts);
      state.parts.legends = clone(state.logs[state.logStep].legends);
    },
    setTextEditMode(state, isTextEditMode) { state.isTextEditMode = isTextEditMode; },
  },
  actions: {
    downloadImages({ commit }) {
      const files = {
        edges: {
          empty: require('../assets/img/edges/edge_empty.svg'),
          half: require('../assets/img/edges/edge_half.svg'),
          full: require('../assets/img/edges/edge_full.svg'),
          emptyHover: require('../assets/img/edges/edge_empty_hover.svg'),
          halfHover: require('../assets/img/edges/edge_half_hover.svg'),
          fullHover: require('../assets/img/edges/edge_full_hover.svg'),
        },
        washings: {
          410: require('../assets/img/sinksWashings/410.svg'),
          813: require('../assets/img/sinksWashings/813.svg'),
          851: require('../assets/img/sinksWashings/851.svg'),
          853: require('../assets/img/sinksWashings/853.svg'),
          855: require('../assets/img/sinksWashings/855.svg'),
          871: require('../assets/img/sinksWashings/871.svg'),
        },
      };
      Object.keys(files).forEach((type) => {
        Object.keys(files[type]).forEach((name) => {
          const image = new Image();
          image.onload = (e) => {
            commit('addFile', {
              type,
              name,
              image: e.target,
            });
          };
          image.src = files[type][name];
        });
      });
    },
  },
  modules: {
    parts: PartsModule,
  },
});
