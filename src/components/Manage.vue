<template>
  <div class="text-left">
    <add-part />
    <add-text class="ml-2" />
  </div>
</template>

<script>
import AddPart from './manage/add-menu/AddPart.vue';
import AddText from './manage/add-menu/AddText.vue';

export default {
  components: {
    AddPart, AddText,
  },
};
</script>
