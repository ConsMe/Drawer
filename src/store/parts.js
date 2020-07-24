import Vue from 'vue';

const clone = (a) => JSON.parse(JSON.stringify(a));

export default {
  state: {
    partsInit: [],
    totalTexts: [],
    boundingBoxes: [],
    refreshSelectedElTrigger: 0,
    defaultEdgeType: 'empty',
  },
  getters: {
    canvasSizeInPx(state, getters, rootState) {
      const { canvasHeightInMm, canvasWidthInMm, pxPerMm } = rootState;
      const size = { width: 0, height: 0 };
      if (canvasWidthInMm) {
        size.width = canvasWidthInMm * pxPerMm;
        size.height = canvasHeightInMm * pxPerMm;
      }
      return size;
    },
    selectedEl(state, getters, rootState) {
      const id = rootState.selectedElId;
      if (!id) return {};
      let selectedEl = {};
      state.partsInit.some((part, i) => {
        if (part.id === id) {
          selectedEl = { i, el: part };
          return true;
        }
        let type = 'points';
        let subType = null;
        let j = part.points.findIndex((p) => p.id === id);
        if (j < 0) {
          subType = null;
          type = 'borders';
          j = part.borders.findIndex((p) => p.id === id);
        }
        if (j < 0) {
          subType = 'edgeTag';
          type = 'borders';
          j = part.borders.findIndex((p) => p.edgeTag && p.edgeTag.id === id);
        }
        if (j < 0 && part.insetsBulges) {
          subType = null;
          type = 'insetsBulges';
          j = part.insetsBulges.findIndex((p) => p.id === id);
        }
        if (j < 0 && part.texts && part.texts.length) {
          subType = null;
          type = 'texts';
          j = part.texts.findIndex((p) => p.id === id);
        }
        if (j < 0) return false;
        selectedEl = { i, j, el: subType ? part[type][j][subType] : part[type][j] };
        return true;
      });
      if (!Object.keys(selectedEl).length && state.totalTexts.length) {
        const index = state.totalTexts.findIndex((t) => t.id === id);
        if (index >= 0) selectedEl = { i: index, el: state.totalTexts[index] };
      }
      return selectedEl;
    },
  },
  mutations: {
    addPart(state, part) {
      state.partsInit.push(part);
    },
    movePoint(state, { partIndex, pointIndex, c }) {
      Vue.set(state.partsInit[partIndex].points[pointIndex], 'c', c);
    },
    addPoint(state, { partIndex, pointIndex, point }) {
      state.partsInit[partIndex].points.splice(pointIndex, 0, point);
    },
    addBorder(state, { partIndex, borderIndex, border }) {
      const sizeTag = border.sizeTag || { isShown: true };
      state.partsInit[partIndex].borders.splice(borderIndex, 0, { ...border, sizeTag });
    },
    deleteBorder(state, { partIndex, borderIndex }) {
      state.partsInit[partIndex].borders.splice(borderIndex, 1);
    },
    deletePoint(state, { partIndex, pointIndex }) {
      state.partsInit[partIndex].borders.splice(pointIndex, 1);
      state.partsInit[partIndex].points.splice(pointIndex, 1);
    },
    makeBorderCurve(state, data) {
      const { partIndex, borderIndex, radius } = data;
      const border = clone(state.partsInit[partIndex].borders[borderIndex]);
      Vue.set(state.partsInit[partIndex].borders, borderIndex, Object.assign(border, {
        type: 'curveBorder',
        radius,
        isInside: data.isInside,
        radiusTag: { isShown: true },
        edgeTag: { isShown: false },
        sizeTag: { isShown: false },
      }));
    },
    makeBorderLine(state, data) {
      const { partIndex, borderIndex } = data;
      const border = clone(state.partsInit[partIndex].borders[borderIndex]);
      delete border.radius;
      delete border.isInside;
      border.type = 'lineBorder';
      border.radiusTag = { isShown: false };
      border.edgeTag = { isShown: false };
      border.sizeTag = { isShown: true };
      Vue.set(state.partsInit[partIndex].borders, borderIndex, border);
    },
    addInsetBulge(state, payload) {
      const { partIndex, ...params } = payload;
      const insetsBulges = state.partsInit[partIndex].insetsBulges || [];
      params.points = [];
      insetsBulges.push({ ...params, pointsInPx: [], type: payload.type });
      Vue.set(state.partsInit[partIndex], 'insetsBulges', insetsBulges);
    },
    setInsetBulgeDepth(state, { i, j, depth }) {
      Vue.set(state.partsInit[i].insetsBulges[j], 'depth', depth);
    },
    deleteInsetBulge(state, { partIndex, insetBulgeIndex }) {
      state.partsInit[partIndex].insetsBulges.splice(insetBulgeIndex, 1);
    },
    refreshSelectedEl(state) {
      setTimeout(() => {
        state.refreshSelectedElTrigger = Math.random();
      }, 0);
    },
    changePoint(state, payload) {
      const { i, j, point } = payload;
      Vue.set(state.partsInit[i].points[j], 'c', [point.x, point.y]);
    },
    changeRadius(state, payload) {
      const { i, j, radius } = payload;
      Vue.set(state.partsInit[i].borders[j], 'radius', radius);
    },
    setPartPosition(state, { i, pos }) { Vue.set(state.partsInit[i], 'position', pos); },
    toggleSkirting(state, { i, j }) {
      Vue.set(state.partsInit[i].borders[j], 'skirting', !state.partsInit[i].borders[j].skirting);
    },
    setRadiusTagParams(state, { i, j, ...payload }) {
      Vue.set(state.partsInit[i].borders[j], 'radiusTag', payload);
    },
    setEdgeTagParams(state, { i, j, ...payload }) {
      let edgeTag;
      if (payload.isShown === false) {
        edgeTag = {};
      } else {
        edgeTag = state.partsInit[i].borders[j].edgeTag || {};
        Object.assign(edgeTag, { edgeType: state.defaultEdgeType, type: 'edge' });
      }
      Vue.set(state.partsInit[i].borders[j], 'edgeTag', { ...edgeTag, ...payload });
      if (payload.edgeType) state.defaultEdgeType = payload.edgeType;
    },
    setSizeTagParams(state, { i, j, ...payload }) {
      Vue.set(state.partsInit[i].borders[j], 'sizeTag', payload);
    },
    setAngleTagParams(state, { i, j, ...payload }) {
      Vue.set(state.partsInit[i].points[j], 'angleTag', payload);
    },
    setPartFill(state, { i, fill }) {
      Vue.set(state.partsInit[i], 'fill', fill);
    },
    deletePart(state, partIndex) {
      state.partsInit.splice(partIndex, 1);
      state.boundingBoxes.splice(partIndex, 1);
    },
    addTextBlock(state, payload) {
      const { i, ...params } = payload;
      if (payload.type === 'totalText') {
        state.totalTexts.push({ ...params });
      } else {
        if (!state.partsInit[i].texts) Vue.set(state.partsInit[i], 'texts', []);
        state.partsInit[i].texts.push({ ...params });
      }
    },
    setTextBlock(state, payload) {
      if (payload.type === 'totalText') {
        Vue.set(state.totalTexts[payload.i], 'text', payload.text);
      } else {
        Vue.set(state.partsInit[payload.i].texts[payload.j], 'text', payload.text);
      }
    },
    deleteTextBlock(state, payload) {
      if (payload.type === 'totalText') {
        state.totalTexts.splice(payload.i, 1);
      } else {
        state.partsInit[payload.i].texts.splice(payload.j, 1);
      }
    },
    setTextParams(state, { i, j, ...payload }) {
      if (payload.type === 'totalText') {
        Vue.set(state.totalTexts, i, payload);
      } else {
        Vue.set(state.partsInit[i].texts[payload.j], 'x', payload.text);
      }
    },
    setBoundingBox(state, { i, bb }) {
      Vue.set(state.boundingBoxes, i, bb);
    },
  },
  actions: {
    refreshSelectedEl({ commit, rootState }) {
      if (rootState.selectedEl) commit('refreshSelectedEl');
    },
    makeBorderCurve({ commit, dispatch }, payload) {
      commit('makeBorderCurve', payload);
      dispatch('refreshSelectedEl');
    },
    makeBorderLine({ commit, dispatch }, payload) {
      commit('makeBorderLine', payload);
      dispatch('refreshSelectedEl');
    },
    changePoint({ commit }, payload) { commit('changePoint', payload); },
    changeRadius({ commit }, payload) { commit('changeRadius', payload); },
    addTextBlock({ commit }, payload) {
      commit('addTextBlock', payload);
      commit('setSelectedElId', payload.id);
      commit('setTextEditMode', true);
    },
  },
};
