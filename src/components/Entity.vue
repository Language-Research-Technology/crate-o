<script setup>
import { reactive, computed, watch, onMounted, onUpdated, toRaw } from "vue";
import { DataStore, resolveComponent } from '../stores/data';
import Property from '../components/Property.vue';

const props = defineProps(['modelValue', 'profile', 'onUpdate']);
const emit = defineEmits(['update:modelValue']);

watch(props, (val, oldVal) => {
  console.log('props changed');
  console.log(val, oldVal);
  if (val && oldVal) {
    console.log(val.modelValue === oldVal.modelValue ? '' : 'entity changed');
    console.log(val.profile === oldVal.profile ? '' : 'profile changed');

  }
}, { immediate: true });

onUpdated(() => {
  console.log('updated');
});
onMounted(() => {
  console.log('mounted');
});

const data = reactive({
  entity: props.modelValue
});
//const entity = computed(() => props.modelValue);
const definitions = computed(() => DataStore.getDefinitions(props.modelValue));
const layouts = computed(() => {
  let d = definitions.value;
  let otherIds = new Set(Object.keys(d));
  console.log('getDefinitions', d);
  const types = props.modelValue['@type'] || [];
  const layoutsByType = props.profile.layouts;
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
  const name = def.id in props.modelValue ? def.id : def.name;
  if (props.modelValue[name] !== value) props.modelValue[name] = value;
  emit('update:modelValue', props.modelValue);
}

</script>

<template>
  <el-form id="#entityForm" label-width="auto" novalidate>
    <component :is="layouts?'el-tabs':'div'" tab-position="left">
      <component :is="layouts?'el-tab-pane':'div'" v-for="layout in (layouts || [{definitions}])" :label="layout.name">
        <Property v-for="def in layout.definitions" :key="def.id" :modelValue="modelValue[def.id] ?? modelValue[def.name]"
          :definition="def" @update:modelValue="v => updateProperty(def, v)"></Property>
      </component>
    </component>
  </el-form>
</template>