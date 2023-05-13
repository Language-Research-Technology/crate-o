<script setup>
import { reactive, computed, watch, onMounted, onUpdated } from "vue";
import { DataStore } from '../stores/data';
import Property from './Property.vue';
import { ElTabs, ElTabPane } from 'element-plus';

const props = defineProps(['modelValue']);
const emit = defineEmits(['update:modelValue']);

// watch(props, (val, oldVal) => {
//   console.log('props changed');
//   console.log(val, oldVal);
//   if (val && oldVal) {
//     console.log(val.modelValue === oldVal.modelValue ? '' : 'entity changed');
//     //console.log(val.profile === oldVal.profile ? '' : 'profile changed');

//   }
// }, { immediate: true });

onUpdated(() => {
  console.log('updated');
});
onMounted(() => {
  console.log('mounted');
});

const data = reactive({
//  entity: props.modelValue,
  activeLayout: ''
});

watch(() => props.modelValue, (e) => {
  data.activeLayout = 'About'
  DataStore.meta[e['@id']] ??= {};
}, { immediate: true });

//const entity = computed(() => props.modelValue);
//const definitions = computed(() => DataStore.getDefinitions(props.modelValue));
const definitions = computed(() => {console.log(props.modelValue['@id']); return DataStore.getDefinitions(props.modelValue)});

const layouts = computed(() => {
  let d = definitions.value;
  let otherIds = new Set(Object.keys(d));
  //console.log('getDefinitions', d);
  const types = props.modelValue['@type'] || [];
  const layoutsByType = DataStore.profile.value?.layouts || [];
  let layouts = types.reduce((l, t) => l || layoutsByType[t], null);
  if (layouts) {
    layouts = [{
      name: 'About',
      description: '',
      inputs: ['@id', '@type', 'name']
    }].concat(layouts);
    for (const layout of layouts) {
      layout.definitions = Object.assign({}, ...layout.inputs.map(name =>
        Object.fromEntries(Object.entries(d).filter(([k, v]) => v.name === name && otherIds.delete(v.id)))
      ));
    }
    if (otherIds.size) {
      layouts.push({
        name: 'Others',
        description: '',
        definitions: Object.fromEntries([...otherIds].map(id => [id, d[id]]))
      });
    }
  }
  return layouts;
});

function updateProperty(def, value) {
  const entity = props.modelValue;
  const name = def.id in entity || DataStore.crate.resolveTerm(def.name) !== def.id ? def.id : def.name;
  if (entity[name] !== value) entity[name] = value;
  emit('update:modelValue', entity);
}

function getProperty(def) {
  console.log('getProperty', def.name);
  const entity = props.modelValue;
  const name = def.id in entity || DataStore.crate.resolveTerm(def.name) !== def.id ? def.id : def.name;
  return entity[name];
}

function getComponents(def) {
  const entity = props.modelValue;
  const c = DataStore.meta[entity['@id']][def.id] ??= [];
  return c;
}

</script>

<template>
  <el-form id="#entityForm" label-width="auto" novalidate>
    <component :is="layouts?ElTabs:'div'" tab-position="left" v-model="data.activeLayout">
      <component :is="layouts?ElTabPane:'div'" v-for="(layout, i) in (layouts || [{ name: 'About', definitions }])"
        :label="layout.name" :name="layout.name">
        <Property v-if="data.activeLayout === layout.name" v-for="def in layout.definitions" :key="def.id" 
          :modelValue="getProperty(def)" :components="getComponents(def)"
          :definition="def" @update:modelValue="v => updateProperty(def, v)"></Property>
      </component>
    </component>
  </el-form>
</template>