<script setup>
import { reactive, computed, onMounted } from 'vue';
import Entity from '../components/Entity.vue';
//import testData from '../../test-data/cooee/ro-crate-metadata.json' ;
import testData from '../../test-data/sydney/ro-crate-metadata.json' ;

import {DataStore} from '../stores/data' ;
import langProfile from '../profiles/text-commons-collection-profile.json';
const data = reactive({
  entity: null,
  profile: langProfile
});

onMounted(async function() {
  await DataStore.setCrate(testData);
  DataStore.setProfile(langProfile);
  data.entity = DataStore.crate.rootDataset;

  window.data = data;
  window.crate = DataStore.crate;
});
</script>

<template>
  <div class="container mx-auto px-4">
    <Entity v-if="data.entity && data.profile" v-model="data.entity" :profile="data.profile"></Entity>
  </div>
</template>
<style>
.el-form-item__content {
  flex-wrap: nowrap;
  align-items: start;
}
</style>