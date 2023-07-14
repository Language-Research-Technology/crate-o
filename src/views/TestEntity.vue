<script setup>
import { reactive, computed, shallowReactive, onMounted, provide } from 'vue';
import Entity from '../components/Entity.vue';
//import testData from '../../test-data/cooee/ro-crate-metadata.json' ;
import testData from '../../test-data/sydney/ro-crate-metadata.json';
import { $state } from '../components/keys';

import { EditorState } from '../components/EditorState';
import langProfile from '../profiles/text-commons-collection-profile.json';
const data = reactive({
  entity: null,
  profile: langProfile
});

const state = shallowReactive(new EditorState());
//window.data.push(sharedData);
provide($state, state);

onMounted(async function () {
  await state.setCrate(testData);
  state.setProfile(langProfile);
  state.crate.addEntity({
    '@id': '#TestPlace',
    '@type': 'Place',
    name: 'TestPlace',
    smokingAllowed: true,
    geo: {
      '@id': '#TestPlace-geo-1',
      '@type': 'GeoShape',
      name: 'TestPlace geo-1',
      box: ['-26 150 -25.5 150.5', '-27 150 -26.5 150.5'],
      circle: '-27 153 100000'
    } 
  }, {recurse: true});
  //data.entity = state.crate.rootDataset;
  data.entity = state.crate.getEntity('#TestPlace');
  state.entity = data.entity;

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
