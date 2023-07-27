<script setup>
import { reactive, computed, watch, onMounted, onUpdated, inject } from "vue";
import { $state } from './keys';
import Property from './Property.vue';
import None from './None.vue';
import { ElTabs, ElTabPane } from 'element-plus';

const props = defineProps(['modelValue']);
const emit = defineEmits(['update:modelValue', 'entityCreated']);
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

watch(() => props.modelValue, () => {
  //console.log(newVal, oldVal)
  data.activeLayout = 'About';
}, { immediate: true });

const definitions = computed(() => state.getDefinitions(props.modelValue));
//const definitions = computed(() => {console.log(props.modelValue['@id']); return state.getDefinitions(props.modelValue)});

const layouts = computed(() => {
  //console.log('getDefinitions', d);
  const types = props.modelValue['@type'] || [];
  const layoutsByType = state.profile?.layouts || {};
  // handle the case of multiple types
  // pick the last type that has layout defined
  let layouts = types.reduce((l, t) => layoutsByType[t] || l, null);
  if (layouts) {
    // create a multi map for indexing definitions by name
    let defsByName = Object.values(definitions.value).reduce((r, d) => (
      r.has(d.name) ? r.get(d.name).push(d) : r.set(d.name, [d]), r
    ), new Map());
    layouts = [{
      name: 'About',
      description: '',
      inputs: ['@id', '@type', 'name']
    }].concat(layouts);
    for (const layout of layouts) {
      const inputs = layout.inputs.reduce((r, name) => {
        let defs = defsByName.get(name);
        if (defs) {
          r.push(...defs);
          defsByName.delete(name);
        }
        return r;
      }, []);
      layout.definitions = Object.fromEntries(inputs.map(d => [d.id, d]));
    }
    if (defsByName.size) {
      layouts.push({
        name: 'Others',
        description: '',
        definitions: Object.fromEntries([].concat(...defsByName.values()).map(d => [d.id, d]))
      });
    }
  } else {
    layouts = [{ name: 'About', definitions: definitions.value }];
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
  <component :is="layouts.length>1?ElTabs:None" tab-position="left" v-model="data.activeLayout">
    <component :is="layouts.length>1?ElTabPane:None" v-for="(layout, i) in layouts" :label="layout.name"
      :name="layout.name">
      <el-form id="#entityForm" label-width="auto" novalidate v-if="data.activeLayout === layout.name">
        <Property v-for="def in layout.definitions" :key="def.id" :modelValue="getProperty(def)"
          :components="getComponents(def)" :definition="def" @update:modelValue="v => updateProperty(def, v)"
          @entityCreated="(e) => $emit('entityCreated', e)"></Property>
      </el-form>
    </component>
  </component>
</template>