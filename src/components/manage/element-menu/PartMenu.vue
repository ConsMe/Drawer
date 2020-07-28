<template>
  <div>
    <p class="mb-0 text-left">Фон</p>
    <select class="custom-select" v-model="fill">
      <option :value="null">Без фона</option>
      <option :value="f.type" v-for="f in fills" :key="f.type">{{ f.title }}</option>
      <!-- <option value="dots">Точки</option>
      <option value="verticalLines">Вертикальные линии</option>
      <option value="horizontalLines">Горизонтальные линии</option>
      <option value="rightDiagonalLines">Правый штрих</option>
      <option value="leftDiagonalLines">Левый штрих</option>
      <option value="rightSmallDiagonalLines">Мелкий штрих</option>
      <option value="rhombus">Ромб</option> -->
    </select>
  </div>
</template>

<script>
export default {
  data() {
    return {
      fill: null,
    };
  },
  computed: {
    selectedEl() { return this.$store.getters.selectedEl; },
    fills() { return this.$store.state.fills; },
  },
  watch: {
    fill(fill) {
      this.$store.commit('setPartFill', {
        fill,
        i: this.selectedEl.i,
      });
      this.$store.commit('addLog');
    },
    selectedEl(selectedEl) {
      if (selectedEl.el.fill !== this.fill) this.fill = this.selectedEl.el.fill;
    },
  },
  mounted() {
    this.fill = this.selectedEl.el.fill;
  },
};
</script>
