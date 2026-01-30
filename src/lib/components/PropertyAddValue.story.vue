/**
* A wrapper component to allow testing of PropertyAddValue.
*/
<script setup>
import { computed, reactive } from 'vue';
import PropertyAddValue from './PropertyAddValue.vue';
import { PropertyDefinition } from "./EditorState";

const props = defineProps({
  types: Array
});

const classes = {
  Organization: {}
};

const definition = computed(() => new PropertyDefinition(classes, {
  id: 'http://schema.org/publisher',
  name: 'publisher',
  label: 'publisher',
  help: 'Test def',
  type: props.types,
  required: true,
}));

const data = reactive({
  values: []
});
function add(type, value, fromLookup) {
  console.log('add');
  data.values.push({type, value});
}
function localSearch(types, query) {
  return [{ '@id': '#lo1', name: 'Local Option 1' }, { '@id': '#lo2', name: 'Local Option 2' }];
}
async function remoteSearch(types, query) {
  return [{ '@id': '#ro1', name: 'Remote Option 1' }, { '@id': '#ro2', name: 'Remote Option 2' }];
}
</script>

<template>
  <div v-for="val in data.values" data-testid="values">{{ val.type.label }} {{ val.value }}</div>
  <PropertyAddValue :definition="definition" :local-search="localSearch" :remote-search="remoteSearch" @add="add"></PropertyAddValue>
</template>
