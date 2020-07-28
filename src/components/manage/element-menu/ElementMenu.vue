<template>
  <div
    class="d-inline-block bg-white p-4 position-absolute element-menu"
    v-if="element">
      <line-border-menu v-if="element.type === 'lineBorder'" />
      <curve-border-menu v-else-if="element.type === 'curveBorder'" />
      <inset-bulge-menu v-else-if="['inset', 'bulge'].includes(element.type)" />
      <edge-menu v-else-if="element.type === 'edge'" :initType="element.edgeType" />
      <part-menu v-else-if="element.type === 'part'" />
      <text-menu v-else-if="['totalText', 'partText'].includes(element.type)" />
      <single-size-tag-menu v-else-if="element.type === 'singleSizeTag'" />
      <legend-menu v-else-if="element.type === 'legend'" />
  </div>
</template>

<script>
import LineBorderMenu from './LineBorderMenu.vue';
import CurveBorderMenu from './CurveBorderMenu.vue';
import InsetBulgeMenu from './InsetBulgeMenu.vue';
import EdgeMenu from './EdgeMenu.vue';
import PartMenu from './PartMenu.vue';
import TextMenu from './TextMenu.vue';
import SingleSizeTagMenu from './SingleSizeTagMenu.vue';
import LegendMenu from './LegendMenu.vue';

export default {
  components: {
    LineBorderMenu,
    CurveBorderMenu,
    InsetBulgeMenu,
    EdgeMenu,
    PartMenu,
    TextMenu,
    SingleSizeTagMenu,
    LegendMenu,
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
