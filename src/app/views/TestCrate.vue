<script setup>
import { reactive, computed, ref } from 'vue';
import CrateEditor from '../components/CrateEditor.vue';
import testData2 from '../../test-data/cooee/ro-crate-metadata.json' ;
import testData from '../../test-data/sydney/ro-crate-metadata.json' ;
import computationalToolProfile from 'ro-crate-editor-profiles/profiles/software-profile.json';
import language_collection from "ro-crate-editor-profiles/profiles/language-data-commons-collection-profile.json";

const data = reactive({
  crate: testData,
  profile: language_collection,
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
