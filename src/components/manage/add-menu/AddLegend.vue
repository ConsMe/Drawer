<template>
  <div class="d-inline-block w-auto">
    <button class="btn btn-secondary ml-2" type="button" @click="openModal">
      Легенда
    </button>
    <div class="modal" ref="modal" tabindex="-1" role="dialog" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="exampleModalLabel">Выберите элемент</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <div class="row justify-content-center">
              <div
              class="col-3 border border-dark rounded m-2 p-2"
              style="cursor: pointer;"
              v-for="el in elements"
              :key="el.subType"
              @click="addLegend(el)">
                <div v-if="el.subType.indexOf('edge') == 0" class="text-center">
                  <img :src="el.img" alt="кромка" style="width: 3rem;">
                </div>
                <div v-else-if="el.subType === 'skirting'" class="text-center">
                  <div
                    class="inline-block m-auto"
                    style="width: 3rem; height: 3rem;">
                    <div style="height: 0.3rem; top: 50%;"
                      class="bg-dark m-auto position-relative"></div>
                  </div>
                </div>
                <div v-else class="text-center">
                  <div
                    class="inline-block border border-dark rounded m-auto"
                    style="width: 3rem; height: 3rem; background: contain repeat;"
                    :style="{
                      backgroundImage: el.bg ? `url('${el.bg}')` : null,
                      backgroundColor: el.subType === 'color' ? 'rgb(200,200,200)' : null,
                    }">
                  </div>
                </div>
                <div class="text-center">{{ el.title }}</div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-dismiss="modal">Отмена</button>
            <button type="button" class="btn btn-primary">Выбрать</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import $ from 'jquery';
import getId from '../../../mixins/getId';
import edgeEmpty from '../../../assets/img/edges/edge_empty.svg';
import edgeHalf from '../../../assets/img/edges/edge_half.svg';
import edgeFull from '../../../assets/img/edges/edge_full.svg';
import fills from '../../../modules/fills';

export default {
  mixins: [getId],
  data() {
    return {
      elements: [
        { subType: 'edge_empty', title: 'Кромка 1', img: edgeEmpty },
        { subType: 'edge_half', title: 'Кромка 2', img: edgeHalf },
        { subType: 'edge_full', title: 'Кромка 3', img: edgeFull },
        { subType: 'skirting', title: 'Бортик' },
        { subType: 'noBg', title: 'Без фона' },
        ...this.$store.state.fills.map((f) => {
          const bg = f.type === 'color' ? null : fills({ type: f.type, color: 'rgb(200,200,200)' });
          return {
            ...f,
            subType: f.type,
            bg: bg ? bg.src : null,
          };
        }),
      ],
    };
  },
  computed: {
    pxPerMm() { return this.$store.state.pxPerMm; },
    canvasWidthInMm() { return this.$store.state.canvasWidthInMm; },
    canvasHeightInMm() { return this.$store.state.canvasHeightInMm; },
  },
  methods: {
    openModal() {
      $(this.$refs.modal).modal('show');
    },
    addLegend(el) {
      $(this.$refs.modal).modal('hide');
      const { subType } = el;
      this.$store.commit('addLegend', {
        id: this.getId(),
        type: 'legend',
        subType,
        text: 'Описание',
        x: this.canvasWidthInMm * 0.4,
        y: this.canvasHeightInMm * 0.8,
        sizeK: 1.6,
      });
    },
  },
};
</script>
