<template>
  <div class="text-left">
    <p class="mb-0 text-left">Размер шрифта</p>
    <button
      v-for="i in 5"
      :key="i"
      @click="setFontSize(i - 1)"
      :class="{active: fontSizeK === sizes[i - 1]}"
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
      sizes: [1, 1.5, 2, 2.5, 3],
    };
  },
  computed: {
    selectedEl() { return this.$store.getters.selectedEl; },
    fontSizeK() { return this.selectedEl.el.fontSizeK; },
  },
  methods: {
    setFontSize(i) {
      if (this.fontSizeK === this.sizes[i]) return;
      this.$store.commit('setTextParams', {
        i: this.selectedEl.i,
        ...this.selectedEl.el,
        fontSizeK: this.sizes[i],
      });
      this.$store.commit('addLog');
    },
  },
};
</script>
