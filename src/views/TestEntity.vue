<script setup>
import { reactive, computed, onMounted } from 'vue';
import Entity from '../components/Entity.vue';
//import testData from '../../test-data/cooee/ro-crate-metadata.json' ;
import testData from '../../test-data/sydney/ro-crate-metadata.json' ;

import {EditorState} from '../components/EditorState' ;
import langProfile from '../profiles/text-commons-collection-profile.json';
const data = reactive({
  entity: null,
  profile: langProfile
});

const state = new EditorState();
onMounted(async function() {
  await state.setCrate(testData);
  state.setProfile(langProfile);
  data.entity = state.crate.rootDataset;

  window.data = data;
  window.state = state;
});

function showJson() {
  console.log(state.crate.toJSON());
}
</script>

<template>
  <div class="container mx-auto px-4">
    <el-button @click="showJson">Show JSON</el-button>
    <Entity v-if="data.entity && data.profile" v-model="data.entity" :profile="data.profile"></Entity>
  </div>
</template>
<style>
.el-form-item__content {
  flex-wrap: nowrap;
  align-items: start;
}
</style>