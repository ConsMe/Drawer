<template>
  <div class="d-inline-block">
    <button
      class="btn btn-outline-dark ml-2"
      type="button"
      title="Скачать изображение"
      @click="saveImage">
      <font-awesome-icon icon="file-image" />
    </button>
    <button
      class="btn btn-outline-dark ml-2"
      type="button"
      title="Скачать PDF"
      @click="savePDF">
      <font-awesome-icon icon="file-pdf" />
    </button>
  </div>
</template>

<script>
import jsPDF from 'jspdf';

export default {
  methods: {
    getDataUrl() {
      return new Promise((resolve) => {
        const { selectedElId } = this.$store.state;
        if (selectedElId) {
          this.$store.commit('setSelectedElId', null);
        }
        setTimeout(() => {
          const params = {
            pixelRatio: 3,
            mimeType: 'image/jpeg',
          };
          resolve(this.$store.state.stage.toDataURL(params));
          if (selectedElId) {
            this.$store.commit('setSelectedElId', selectedElId);
          }
        }, 0);
      });
    },
    async saveImage() {
      const dataURL = await this.getDataUrl();
      const link = document.createElement('a');
      link.download = 'stage.jpg';
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    async savePDF() {
      const dataURL = await this.getDataUrl();
      // eslint-disable-next-line new-cap
      const pdf = new jsPDF('l', 'mm', 'a4');
      let width = pdf.internal.pageSize.getWidth();
      let height = pdf.internal.pageSize.getHeight();
      const pdfRatio = width / height;
      const stageRatio = this.$store.state.stage.width() / this.$store.state.stage.height();
      let top = 0;
      let left = 0;
      if (pdfRatio < stageRatio) {
        height = width / stageRatio;
        top = (pdf.internal.pageSize.getHeight() - height) / 2;
      } else {
        width = height / stageRatio;
        left = (pdf.internal.pageSize.getWidth() - width) / 2;
      }
      pdf.addImage(dataURL, 'JPEG', left, top, width, height);
      pdf.save('stage.pdf');
    },
  },
};
</script>
