<script setup>
import { reactive, computed, ref } from 'vue';
import CrateEditor from '../../lib/components/CrateEditor.vue';
import testData2 from '../../../test-data/cooee/ro-crate-metadata.json' ;
import testData from '../../../test-data/sydney/ro-crate-metadata.json' ;
import computationalToolProfile from 'ro-crate-editor-profiles/modes/software.json';
import language_collection from "ro-crate-editor-profiles/modes/language-data-commons.json";

const data = reactive({
  crate: testData,
  mode: language_collection,
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

    <CrateEditor ref="editor" v-model:entityId="data.entityId" :crate="data.crate" :mode="data.mode"></CrateEditor>
  </div>
</template>
