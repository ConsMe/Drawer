<template>
  <div class="d-inline-block">
    <button
      class="btn btn-secondary"
      type="button"
      @click="addText">
      Текст
    </button>
  </div>
</template>

<script>
import getId from '../../../mixins/getId';

export default {
  mixins: [getId],
  methods: {
    addText() {
      this.$store.dispatch('addTextBlock', {
        id: this.getId(),
        x: 10,
        y: 100,
        type: 'totalText',
        fontSizeK: 1,
        text: '',
      });
    },
  },
};
</script>
