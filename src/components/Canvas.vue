<template>
  <div>
    <template v-if="isMounted">
      <konva />
    </template>
  </div>
</template>

<script>
import Konva from './canvas/Konva.vue';

export default {
  components: {
    Konva,
  },
  data() {
    return {
      isMounted: false,
    };
  },
  mounted() {
    this.isMounted = true;
    // const ctrl = ['ControlLeft', 'ControlRight'];
    // window.addEventListener('keydown', (e) => {
    //   if (ctrl.includes(e.code)) {
    //     this.$store.commit('changeControlPressed', true);
    //   }
    // });
    // window.addEventListener('keyup', (e) => {
    //   if (ctrl.includes(e.code)) {
    //     this.$store.commit('changeControlPressed', false);
    //   }
    // });
  },
};
</script>
