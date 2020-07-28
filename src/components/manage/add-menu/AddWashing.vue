<template>
  <div class="d-inline-block w-auto">
    <div class="modal" ref="modal" tabindex="-1" role="dialog" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="exampleModalLabel">Выберите мойку / раковину</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <div class="row justify-content-center">
              <div
              class="col-3 border border-dark rounded m-2 p-2"
              style="cursor: pointer;"
              v-for="sw in sws"
              :key="sw.name"
              @click="addSw(sw)">
                <div class="text-center">
                  <img
                    :src="require(`../../../assets/img/sinksWashings/${sw.name}.svg`)"
                    alt="раковина"
                    style="width: 5rem;">
                </div>
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

export default {
  mixins: [getId],
  props: ['trigger'],
  data() {
    return {
      sws: [
        { name: 410, h: 433, w: 517 },
        { name: 813, h: 523, w: 530 },
        { name: 851, h: 523, w: 435 },
        { name: 853, h: 465, w: 328 },
        { name: 855, h: 419, w: 490 },
        { name: 871, h: 528, w: 631 },
      ],
    };
  },
  computed: {
    pxPerMm() { return this.$store.state.pxPerMm; },
    canvasWidthInMm() { return this.$store.state.canvasWidthInMm; },
    canvasHeightInMm() { return this.$store.state.canvasHeightInMm; },
  },
  watch: {
    trigger() {
      $(this.$refs.modal).modal('show');
    },
  },
  methods: {
    addSw(sw) {
      $(this.$refs.modal).modal('hide');
      this.$store.commit('addWashing', {
        i: this.trigger.partIndex,
        id: this.getId(),
        subType: sw.name,
        height: sw.h,
        width: sw.w,
        type: 'sw',
        x: this.trigger.left - this.trigger.partPosition.x / this.pxPerMm,
        y: this.trigger.top - this.trigger.partPosition.y / this.pxPerMm,
      });
    },
  },
};
</script>
