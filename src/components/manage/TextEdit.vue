<template>
  <div
    v-if="style"
    class="position-absolute"
    :style="style">
    <textarea
      class="w-100 h-100"
      @blur="saveText"
      ref="text"
      style="line-height: 1; resize: none;"
      v-model="text">
    </textarea>
  </div>
</template>

<script>
export default {
  data() {
    return {
      text: '',
      width: 0,
      height: 0,
    };
  },
  computed: {
    selectedEl() { return this.$store.getters.selectedEl; },
    isTextEditMode() { return this.$store.state.isTextEditMode; },
    pxPerMm() { return this.$store.state.pxPerMm; },
    style() {
      const { el } = this.selectedEl;
      if (!el || !this.isTextEditMode) return null;
      if (!['text', 'totalText', 'legend'].includes(el.type)) return null;
      const sizeK = el.type === 'totalText'
        ? this.selectedEl.el.fontSizeK : this.selectedEl.el.sizeK;
      const fontSize = this.$store.state.fontSizeInmM.text * this.pxPerMm * sizeK;
      let style;
      if (el.type === 'totalText' || el.type === 'legend') {
        style = {
          top: `${el.y * this.pxPerMm}px`,
          left: `${el.x * this.pxPerMm}px`,
          fontSize: `${Math.round(fontSize)}px`,
        };
        const textNodes = this.$store.state.stage.find('Text');
        const textNode = textNodes.toArray().find((t) => t.id() === el.id);
        const width = textNode.width();
        const height = textNode.height();
        if (width) style.width = `${width + 30}px`;
        if (height > fontSize) style.height = `${height + 10}px`;
        return style;
      }
      return null;
    },
  },
  watch: {
    style(nv) {
      if (nv) {
        this.text = this.selectedEl.el.text;
        setTimeout(() => {
          this.$refs.text.focus();
        }, 0);
      }
    },
  },
  methods: {
    saveText() {
      const text = this.text.trim();
      const { i, j, el } = this.selectedEl;
      const { type } = el;
      const payload = { i, j, type };
      if (!text.length) {
        const delCommit = el.type === 'totalText' ? 'deleteTextBlock' : 'deleteLegend';
        this.$store.commit(delCommit, payload);
        if (el.text.length) {
          this.$store.commit('addLog');
        }
      } else {
        const setCommit = el.type === 'totalText' ? 'setTextBlock' : 'setLegendParams';
        const setPayload = el.type === 'totalText' ? { ...payload, text } : { i, text };
        this.$store.commit(setCommit, setPayload);
        this.$store.commit('addLog');
      }
      this.$store.commit('setTextEditMode', false);
    },
  },
};
</script>
