<template>
  <div
    class="d-inline-block bg-white p-4 position-absolute element-menu"
    v-if="element">
      <line-border v-if="element.type === 'lineBorder'" />
      <curve-border v-if="element.type === 'curveBorder'" />
      <inset-bulge v-if="['inset', 'bulge'].includes(element.type)" />
      <edge v-if="element.type === 'edge'" :initType="element.edgeType" />
  </div>
</template>

<script>
import LineBorder from './LineBorder.vue';
import CurveBorder from './CurveBorder.vue';
import InsetBulge from './InsetBulge.vue';
import Edge from './Edge.vue';

export default {
  components: {
    LineBorder, CurveBorder, InsetBulge, Edge,
  },
  computed: {
    element() { return this.$store.getters.selectedEl.el; },
  },
};
</script>

<style lang="scss">
.element-menu {
  top: 10%;
  right: 5%;
  width: 300px;
  input {
    width: 5rem;
  }
}
</style>
