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
  },
};
</script>
