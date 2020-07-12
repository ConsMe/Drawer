<template>
  <div class="d-inline-block bg-white position-absolute logs-menu">
    <button
      class="btn btn-outline-dark mr-2"
      type="button"
      ref="logBack"
      :disabled="disabledBack"
      @click="$store.commit('logBack')">
      <font-awesome-icon icon="reply" />
    </button>
    <button
      class="btn btn-outline-dark"
      type="button"
      :disabled="disabledForward"
      ref="logForward"
      @click="$store.commit('logForward')">
      <font-awesome-icon icon="share" />
    </button>
    <save />
  </div>
</template>

<script>
import Save from './Save.vue';

export default {
  components: { Save },
  computed: {
    logs() { return this.$store.state.logs; },
    logStep() { return this.$store.state.logStep; },
    disabledBack() {
      return !this.logs.length || !this.logStep;
    },
    disabledForward() {
      return this.logStep >= this.logs.length - 1;
    },
  },
  mounted() {
    window.addEventListener('keydown', (e) => {
      if (!e.ctrlKey) return;
      if (e.code === 'KeyZ') {
        this.$refs.logBack.click();
      } else if (e.code === 'KeyY') {
        this.$refs.logForward.click();
      }
    });
  },
};
</script>

<style lang="scss">
.logs-menu {
  top: 10px;
  left: 10px;
}
</style>
