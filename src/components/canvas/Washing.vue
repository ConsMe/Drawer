<template>
  <v-image
    :config="{
      ...config,
    }"
    ref="image"
    @dragend="dragend"
    @contextmenu="setContextMenuEvent" />
</template>

<script>
export default {
  props: ['washingIndex', 'partIndex'],
  data() {
    return {
      isCtrlKey: false,
      startPoint: {},
    };
  },
  computed: {
    pxPerMm() { return this.$store.state.pxPerMm; },
    part() { return this.$store.state.parts.partsInit[this.partIndex]; },
    washing() { return this.part.washings[this.washingIndex]; },
    partPosition() { return this.part.position; },
    contextMenuAction() { return this.$store.state.contextMenuAction; },
    config() {
      const { washing } = this;
      return {
        x: washing.x * this.pxPerMm,
        y: washing.y * this.pxPerMm,
        height: washing.height * this.pxPerMm,
        width: washing.width * this.pxPerMm,
        type: 'washing',
        draggable: true,
        subType: washing.subType,
        image: this.$store.state.files.washings[washing.subType],
      };
    },
  },
  watch: {
    contextMenuAction(data) {
      if (data.partIndex !== this.partIndex) return;
      if (data.washingIndex !== this.washingIndex) return;
      if (data.action === 'deleteWashing') {
        setTimeout(() => {
          this.$store.commit('deleteWashing', {
            i: data.partIndex,
            j: data.washingIndex,
          });
          this.$store.commit('addLog');
        }, 0);
      }
    },
  },
  methods: {
    setContextMenuEvent(e) {
      const { partIndex, washingIndex } = this;
      this.$store.commit('setContextMenuEvent', {
        e,
        partIndex,
        washingIndex,
      });
    },
    dragend(e) {
      this.$refs.image.getNode().clearCache();
      const coords = e.target.absolutePosition();
      this.$store.commit('setWashingParams', {
        i: this.partIndex,
        j: this.washingIndex,
        x: (coords.x - this.partPosition.x) / this.pxPerMm,
        y: (coords.y - this.partPosition.y) / this.pxPerMm,
      });
      this.$store.commit('addLog');
    },
  },
};
</script>
