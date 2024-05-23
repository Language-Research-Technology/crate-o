<script setup>
import { reactive, computed, shallowReactive, onMounted, provide } from 'vue';
import Entity from '../../lib/components/Entity.vue';
//import testData from '../../test-data/cooee/ro-crate-metadata.json' ;
import testData from '../../../test-data/sydney/ro-crate-metadata.json';
import { $state } from '../../lib/components/keys';
import { ElButton } from 'element-plus';
import { EditorState } from '../../lib/components/EditorState';
import language_collection from 'ro-crate-modes/modes/language-data-commons-collection.json';
const data = reactive({
  entity: null,
  profile: language_collection
});

const state = shallowReactive(new EditorState());
//window.data.push(sharedData);
provide($state, state);

onMounted(async function () {
  await state.setCrate(testData);
  state.setProfile(language_collection);
  state.crate.addEntity({
    '@id': '#TestPlace',
    '@type': 'Place',
    name: 'TestPlace',
    smokingAllowed: true,
    geo: {
      '@id': '#TestPlace-geo-1',
      '@type': ['GeoCoordinates','GeoShape'],
      name: 'TestPlace geo-1',
      latitude: -27,
      longitude: 149,
      box: ['-26 150 -25.5 150.5', '-27 150 -26.5 150.5'],
      circle: '-27 153 100000'
    } 
  }, {recurse: true});
  //data.entity = state.crate.rootDataset;
  data.entity = state.crate.getEntity('#TestPlace');

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
