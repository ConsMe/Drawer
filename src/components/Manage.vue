<template>
  <div class="text-left">
    <add-part />
    <add-text class="ml-2" />
    <add-legend class="ml-2" />
  </div>
</template>

<script>
import AddPart from './manage/add-menu/AddPart.vue';
import AddText from './manage/add-menu/AddText.vue';
import AddLegend from './manage/add-menu/AddLegend.vue';

export default {
  components: {
    AddPart, AddText, AddLegend,
  },
};
</script>
