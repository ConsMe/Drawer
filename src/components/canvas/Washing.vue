<template>
  <v-image
    :config="{
      ...config,
    }" />
</template>

<script>
export default {
  props: ['washingIndex', 'partIndex'],
  data() {
    return {
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
        // scale: { x: 0.25, y: 0.25 },
        type: 'washing',
        draggable: true,
        subType: washing.subType,
        image: this.$store.state.files.washings[washing.subType],
      };
    },
  },
};
</script>
