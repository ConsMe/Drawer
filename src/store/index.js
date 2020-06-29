/* eslint-disable global-require */
import Vue from 'vue';
import Vuex from 'vuex';
import PartsModule from './parts';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    canvasHeightInMm: 4000,
    pxPerMm: 0,
    contextMenuEvent: null,
    contextMenuAction: {},
    selectedElId: null,
    currentElId: null,
    id: 0,
    fontSizeInmM: {
      sizeArrow: 90,
      radius: 90,
    },
    files: { edges: {} },
  },
  getters: {
    gridSize() { return 10; },
  },
  mutations: {
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
  },
  actions: {
    downloadEdges({ commit }) {
      const edges = {
        empty: require('../assets/img/edges/edge_empty.svg'),
        half: require('../assets/img/edges/edge_half.svg'),
        full: require('../assets/img/edges/edge_full.svg'),
        emptyHover: require('../assets/img/edges/edge_empty_hover.svg'),
        halfHover: require('../assets/img/edges/edge_half_hover.svg'),
        fullHover: require('../assets/img/edges/edge_full_hover.svg'),
      };
      Object.keys(edges).forEach((edge) => {
        const image = new Image();
        image.onload = (e) => {
          commit('addFile', {
            type: 'edges',
            name: edge,
            image: e.target,
          });
        };
        image.src = edges[edge];
      });
    },
  },
  modules: {
    parts: PartsModule,
  },
});
