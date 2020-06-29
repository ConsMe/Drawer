import Vue from 'vue';

const clone = (a) => JSON.parse(JSON.stringify(a));

export default {
  state: {
    partsInit: [],
    refreshSelectedElTrigger: 0,
    defaultEdgeType: 'empty',
  },
  getters: {
    parts(state, getters, rootState) {
      return state.partsInit.map((partInit) => {
        const part = clone(partInit);
        const { points, borders } = part;
        const { pxPerMm } = rootState;
        points.forEach((point, i) => {
          const next = i < points.length - 1 ? i + 1 : 0;
          borders[i].points = [...point.c, ...points[next].c];
          borders[i].pointsId = [point.id, points[next].id];
          const prev = i ? i - 1 : points.length - 1;
          points[i].bordersId = [borders[i].id, borders[prev].id];
          points[i].pBId = [...points[i].bordersId, point.id];
          points[i].cInPx = point.c.map((pc) => pc * pxPerMm);
          borders[i].pointsInPx = borders[i].points.map((pc) => pc * pxPerMm);
          if (borders[i].radius) borders[i].radiusInPx = borders[i].radius * pxPerMm;
          if (['inset', 'bulge'].includes(point.subType)) {
            const index = part.insetsBulges.findIndex((ib) => ib.id === point.insetBulgeId);
            part.insetsBulges[index].points.push(...point.c);
            part.insetsBulges[index].pointsInPx.push(...points[i].cInPx);
          }
        });
        return part;
      });
    },
    canvasSizeInPx(state, getters, rootState) {
      const { canvasHeightInMm, canvasWidthInMm, pxPerMm } = rootState;
      const size = { width: 0, height: 0 };
      if (canvasWidthInMm) {
        size.width = canvasWidthInMm * pxPerMm;
        size.height = canvasHeightInMm * pxPerMm;
      }
      return size;
    },
    boundingBoxes(state, getters) {
      return getters.parts.map((part) => {
        const xs = part.points.map((p) => p.cInPx[0]);
        const ys = part.points.map((p) => p.cInPx[1]);
        const bb = {
          id: part.id,
          absolute: {
            x1: Math.min(...xs),
            x2: Math.max(...xs),
            y1: Math.min(...ys),
            y2: Math.max(...ys),
          },
        };
        bb.relative = {
          x1: bb.absolute.x1 + part.position.x,
          x2: bb.absolute.x2 + part.position.x,
          y1: bb.absolute.y1 + part.position.y,
          y2: bb.absolute.y2 + part.position.y,
        };
        bb.width = Math.abs(bb.absolute.x2 - bb.absolute.x1);
        bb.height = Math.abs(bb.absolute.y2 - bb.absolute.y1);
        return bb;
      });
    },
    selectedEl(state, getters, rootState) {
      const id = rootState.selectedElId;
      if (!id) return {};
      let selectedEl = {};
      getters.parts.some((part, i) => {
        let type = 'points';
        let subType = null;
        let j = part.points.findIndex((p) => p.id === id);
        if (j < 0) {
          subType = null;
          type = 'borders';
          j = part.borders.findIndex((p) => p.id === id);
        }
        if (j < 0) {
          subType = 'edge';
          type = 'borders';
          j = part.borders.findIndex((p) => p.edge && p.edge.id === id);
        }
        if (j < 0 && part.insetsBulges) {
          subType = null;
          type = 'insetsBulges';
          j = part.insetsBulges.findIndex((p) => p.id === id);
        }
        if (j < 0) return false;
        selectedEl = { i, j, el: subType ? part[type][j][subType] : part[type][j] };
        return true;
      });
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
      state.partsInit[partIndex].borders.splice(borderIndex, 0, border);
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
      }));
    },
    makeBorderLine(state, data) {
      const { partIndex, borderIndex } = data;
      const border = clone(state.partsInit[partIndex].borders[borderIndex]);
      delete border.radius;
      delete border.isInside;
      border.type = 'lineBorder';
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
    changeSizeArrow(state, { i, j, sizeArrow }) {
      Vue.set(state.partsInit[i].borders[j], 'sizeArrow', sizeArrow);
    },
    changeRadiusPosition(state, { i, j, radiusPosition }) {
      Vue.set(state.partsInit[i].borders[j], 'radiusPosition', radiusPosition);
    },
    showHideAngle(state, { i, j, angleTag }) {
      Vue.set(state.partsInit[i].points[j], 'angleTag', angleTag);
    },
    addHideEdge(state, payload) {
      const { i, j, action } = payload;
      if (action === 'addEdge') {
        const edge = { edgeType: state.defaultEdgeType, id: payload.id, type: 'edge' };
        Vue.set(state.partsInit[i].borders[j], 'edge', edge);
      } else {
        Vue.delete(state.partsInit[i].borders[j], 'edge');
      }
    },
    setEdgeType(state, { i, j, edgeType }) {
      Vue.set(state.partsInit[i].borders[j].edge, 'edgeType', edgeType);
      state.defaultEdgeType = edgeType;
    },
    toggleSkirting(state, { i, j }) {
      Vue.set(state.partsInit[i].borders[j], 'skirting', !state.partsInit[i].borders[j].skirting);
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
  },
};
