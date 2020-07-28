<template>
  <div>
    <v-text
      :config="{
        type: text.type,
        id: text.id,
        x: text.x * this.pxPerMm,
        y: text.y * this.pxPerMm,
        text: text.text,
        fontFamily: 'Calibri',
        fontSize,
        fill: [currentElId, selectedElId].includes(text.id)
          ? selectedColor : 'black',
        draggable: true,
        visible: !(selectedElId === text.id && isTextEditMode)
      }"
      @mouseover="over = true"
      @mouseleave="over = false"
      @dragend="dragend"
      @click="$store.commit('setSelectedElId', text.id)"
      @dblclick="editText"
      @contextmenu="setContextMenuEvent" />
  </div>
</template>

<script>
export default {
  props: ['text', 'textIndex'],
  data() {
    return {
      over: false,
    };
  },
  computed: {
    selectedColor() { return this.$store.state.selectedColor; },
    selectedElId() { return this.$store.state.selectedElId; },
    currentElId() { return this.$store.state.currentElId; },
    pxPerMm() { return this.$store.state.pxPerMm; },
    fontSize() { return this.$store.state.fontSizeInmM.text * this.pxPerMm * this.text.fontSizeK; },
    isTextEditMode() { return this.$store.state.isTextEditMode; },
    contextMenuAction() { return this.$store.state.contextMenuAction; },
  },
  watch: {
    over(over) {
      if (over) {
        this.$store.commit('setCursor', 'move');
        this.$store.commit('setCurrentEl', this.text.id);
      } else {
        this.$store.commit('resetCursor');
        this.$store.commit('setCurrentEl', null);
      }
    },
    contextMenuAction(data) {
      if (data.textIndex !== this.textIndex) return;
      if (data.action === 'deleteTotalText') {
        this.$store.commit('deleteTextBlock', { type: 'totalText', i: data.textIndex });
        this.$store.commit('addLog');
      }
    },
  },
  methods: {
    dragend(e) {
      const pos = e.target.getPosition();
      pos.x /= this.pxPerMm;
      pos.y /= this.pxPerMm;
      this.$store.commit('setTextParams', { ...this.text, ...pos, i: this.textIndex });
      this.$store.commit('addLog');
    },
    editText() {
      this.$store.commit('setTextEditMode', true);
    },
    setContextMenuEvent(e) {
      const { textIndex } = this;
      this.$store.commit('setContextMenuEvent', { e, textIndex, type: 'totalText' });
    },
  },
};
</script>
