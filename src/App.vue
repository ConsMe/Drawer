<template>
  <div id="app">
    <drawer />
    <confirm-modal />
  </div>
</template>

<script>
import 'bootstrap';
import Drawer from './components/Drawer.vue';
import ConfirmModal from './components/manage/ConfirmModal.vue';

export default {
  name: 'App',
  components: {
    Drawer,
    ConfirmModal,
  },
  created() {
    this.$store.dispatch('downloadImages');
  },
};
</script>

<style lang="scss">
@import "~bootstrap/scss/bootstrap";
@import '~toastr/toastr.scss';
@import '~quill/dist/quill.core.css';
@import '~quill/dist/quill.snow.css';
@import '~quill/dist/quill.bubble.css';

.toast {
  opacity: 1 !important;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
@media (min-width: 576px) {
  .container {
      max-width: 576px;
  }
}
@media (min-width: 768px) {
  .container {
      max-width: 768px;
  }
}
@media (min-width: 992px) {
  .container {
      max-width: 992px;
  }
}
@media (min-width: 1200px) {
  .container {
      max-width: 1200px;
  }
}
@media (min-width: 1400px) {
  .container {
      max-width: 1400px;
  }
}
</style>
