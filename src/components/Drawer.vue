<template>
  <div class="container mt-5">
    <manage />
    <Canvas />
  </div>
</template>

<script>
import Manage from './Manage.vue';
import Canvas from './Canvas.vue';

export default {
  components: {
    Manage,
    Canvas,
  },
};
</script>
