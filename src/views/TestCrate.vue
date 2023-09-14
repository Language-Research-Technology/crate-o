<script setup>
import { reactive, computed, ref } from 'vue';
import CrateEditor from '../components/CrateEditor.vue';
import testData2 from '../../test-data/cooee/ro-crate-metadata.json' ;
import testData from '../../test-data/sydney/ro-crate-metadata.json' ;
import langProfile from '../profiles/text-commons-collection-profile.json';
import baseProfile from '../profiles/base-profile.json';
import computationalToolProfile from '../profiles/software-profile.json';

const data = reactive({
  crate: testData,
  profile: computationalToolProfile,
  entityId: ''
});
//window.data = [];
const editor = ref();
function showJson() {
  console.log(editor.value.crate);
}
const test = {};
</script>

<template>
  <div class="container mx-auto px-4">
    <el-button @click="showJson">Show JSON</el-button>

    <CrateEditor ref="editor" v-model:entityId="data.entityId" :crate="data.crate" :profile="data.profile"></CrateEditor>
  </div>
</template>
