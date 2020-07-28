<template>
  <div class="text-left">
    <p class="mb-0 text-left">Размер</p>
    <button
      v-for="i in 3"
      :key="i"
      @click="setFontSize(i - 1)"
      :class="{active: sizeK === sizes[i - 1]}"
      class="btn btn-outline-secondary mr-1">
      <font-awesome-icon
        icon="font"
        :style="{transform: `scale(${sizes[i - 1] / 3})`}" />
    </button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      sizes: [1.2, 1.6, 2],
    };
  },
  computed: {
    selectedEl() { return this.$store.getters.selectedEl; },
    sizeK() { return this.selectedEl.el.sizeK; },
  },
  methods: {
    setFontSize(i) {
      if (this.sizeK === this.sizes[i]) return;
      this.$store.commit('setLegendParams', {
        i: this.selectedEl.i,
        sizeK: this.sizes[i],
      });
      this.$store.commit('addLog');
    },
  },
};
</script>
