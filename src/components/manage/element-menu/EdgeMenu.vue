<template>
  <div>
    <p class="mb-0 text-left">Тип</p>
    <div
      class="custom-control custom-radio text-left"
      v-for="type in types"
      :key="type.type">
      <input
        type="radio"
        :id="type.type"
        :value="type.type"
        class="custom-control-input"
        v-model="selectedType">
      <label
        class="custom-control-label d-flex align-items-center"
        :for="type.type">
        <img :src="files[type.type].src" style="width: 1rem;" class="mx-2">
        {{ type.name }}
      </label>
    </div>
  </div>
</template>

<script>
export default {
  props: ['initType'],
  data() {
    return {
      types: [
        { name: 'Кромка 1', type: 'empty' },
        { name: 'Кромка 2', type: 'half' },
        { name: 'Кромка 3', type: 'full' },
      ],
      selectedType: this.initType,
    };
  },
  computed: {
    selectedEl() { return this.$store.getters.selectedEl; },
    files() { return this.$store.state.files.edges; },
  },
  watch: {
    selectedType(nv) {
      const { i, j } = this.selectedEl;
      this.$store.commit('setEdgeTagParams', { i, j, edgeType: nv });
      this.$store.commit('addLog');
    },
  },
};
</script>
