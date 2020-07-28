import Vue from 'vue';

const clone = (a) => JSON.parse(JSON.stringify(a));

export default {
  state: {
    partsInit: [],
    totalTexts: [],
    legends: [],
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
        if (j < 0 && part.singleSizeTags && part.singleSizeTags.length) {
          subType = null;
          type = 'singleSizeTags';
          j = part.singleSizeTags.findIndex((p) => p.id === id);
        }
        if (j < 0) return false;
        selectedEl = { i, j, el: subType ? part[type][j][subType] : part[type][j] };
        return true;
      });
      if (!Object.keys(selectedEl).length && state.totalTexts.length) {
        const index = state.totalTexts.findIndex((t) => t.id === id);
        if (index >= 0) selectedEl = { i: index, el: state.totalTexts[index] };
      }
      if (!Object.keys(selectedEl).length && state.legends.length) {
        const index = state.legends.findIndex((t) => t.id === id);
        if (index >= 0) selectedEl = { i: index, el: state.legends[index] };
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
    addPoint(state, payload) {
      const { i, j, point } = payload;
      const { border } = payload;
      border.sizeTag = { isShown: true };
      border.edgeTag = { isShown: false };
      point.angleTag = { isShown: false };
      state.partsInit[i].points.splice(j, 0, point);
      state.partsInit[i].borders.splice(j, 0, border);
    },
    deletePoint(state, { i, j }) {
      state.partsInit[i].points.splice(j, 1);
      const borderIndex = j > 0 ? j - 1 : state.partsInit[i].borders.length - 1;
      state.partsInit[i].borders.splice(borderIndex, 1);
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
      const iB = { ...params, type: payload.type, pointsIndexes: [] };
      // const insetsBulges = state.partsInit[partIndex].insetsBulges || [];
      // insetsBulges.push({ ...params, type: payload.type });
      // Vue.set(state.partsInit[partIndex], 'insetsBulges', insetsBulges);
      state.partsInit[partIndex].insetsBulges.push(iB);
    },
    setInsetBulgeDepth(state, { i, j, depth }) {
      Vue.set(state.partsInit[i].insetsBulges[j], 'depth', depth);
    },
    deleteInsetBulge(state, { i, j }) {
      state.partsInit[i].insetsBulges.splice(j, 1);
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
      state.partsInit[i].borders[j].radiusTag = payload;
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
      state.partsInit[i].borders[j].sizeTag = payload;
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
    assignBordersPointsIds(state, partIndex) {
      const { points, borders, insetsBulges } = state.partsInit[partIndex];
      points.forEach((point, i) => {
        const next = i < points.length - 1 ? i + 1 : 0;
        state.partsInit[partIndex].borders[i].pointsId = [point.id, points[next].id];
        state.partsInit[partIndex].borders[i].pointsIndexes = [i, next];
        const prev = i ? i - 1 : points.length - 1;
        state.partsInit[partIndex].points[i].bordersId = [borders[prev].id, borders[i].id];
        state.partsInit[partIndex].points[i].bordersIndexes = [prev, i];
      });
      insetsBulges.forEach((iB, j) => {
        const pointsIndexes = iB.pointsId.map((id) => points.findIndex((p) => p.id === id));
        state.partsInit[partIndex].insetsBulges[j].pointsIndexes = pointsIndexes;
      });
    },
    addSingleSizeTag(state, { i, ...params }) {
      state.partsInit[i].singleSizeTags.push(params);
    },
    setSingleSizeTagParams(state, { i, j, ...params }) {
      Object.assign(state.partsInit[i].singleSizeTags[j], params);
    },
    deleteSingleSizeTag(state, { i, j }) {
      state.partsInit[i].singleSizeTags.splice(j, 1);
    },
    addLegend(state, legend) {
      state.legends.push(legend);
    },
    setLegendParams(state, { i, ...params }) {
      Object.assign(state.legends[i], params);
    },
    deleteLegend(state, { i }) {
      state.legends.splice(i, 1);
    },
    addWashing(state, { i, ...params }) { state.partsInit[i].washings.push(params); },
  },
  actions: {
    addPart({ commit, state }, part) {
      commit('addPart', part);
      commit('assignBordersPointsIds', state.partsInit.length - 1);
    },
    addPoint({ commit }, payload) {
      commit('addPoint', payload);
      commit('assignBordersPointsIds', payload.i);
    },
    deletePoint({ commit }, payload) {
      commit('deletePoint', payload);
      commit('assignBordersPointsIds', payload.i);
    },
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
    addInsetBulge({ commit }, payload) {
      commit('addInsetBulge', payload);
      commit('assignBordersPointsIds', payload.partIndex);
    },
    deleteInsetBulge({ commit }, payload) {
      commit('deleteInsetBulge', payload);
      commit('assignBordersPointsIds', payload.i);
    },
  },
};
