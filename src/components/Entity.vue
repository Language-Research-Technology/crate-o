<script setup>
import { reactive, computed, watch, onMounted, onUpdated, inject } from "vue";
import { $state } from './keys';
import Property from './Property.vue';
import { ElTabs, ElTabPane } from 'element-plus';

const props = defineProps(['modelValue']);
const emit = defineEmits(['update:modelValue']);
const state = inject($state);
// watch(props, (val, oldVal) => {
//   console.log('props changed');
//   console.log(val, oldVal);
//   if (val && oldVal) {
//     console.log(val.modelValue === oldVal.modelValue ? '' : 'entity changed');
//     //console.log(val.profile === oldVal.profile ? '' : 'profile changed');

//   }
// }, { immediate: true });

onUpdated(() => {
  console.log('entity updated');
});
onMounted(() => {
  console.log('mounted');
  //console.log(definitions.value);
});

const data = reactive({
//  entity: props.modelValue,
  activeLayout: ''
});

watch([state, () => props.modelValue], () => {
  data.activeLayout = 'About';
}, { immediate: true });

const definitions = computed(() => state.getDefinitions(props.modelValue));
//const definitions = computed(() => {console.log(props.modelValue['@id']); return state.getDefinitions(props.modelValue)});

const layouts = computed(() => {
  let d = definitions.value;
  let otherIds = new Set(Object.keys(d));
  //console.log('getDefinitions', d);
  const types = props.modelValue['@type'] || [];
  const layoutsByType = state.profile?.layouts || [];
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
  const key = def.key || def.name;
  if (entity[key] !== value) entity[key] = value;
  emit('update:modelValue', entity);
}

function getProperty(def) {
  // console.log('getProperty', def.name);
  // console.log('def.id', def.id);
  // console.log('def.name', def.name);
  // console.log('def.key', def.key);
  const entity = props.modelValue;
  const key = def.key || def.name;
  return entity[key];
}

function getComponents(def) {
  const entity = props.modelValue;
  return state.getComponents(entity['@id'], def.id);
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