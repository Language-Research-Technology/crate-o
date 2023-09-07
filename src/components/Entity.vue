<script setup>
import {ref, computed, watch, onMounted, onUpdated, inject} from "vue";
import {$state} from './keys';
import Property from './Property.vue';
import {ElTabs, ElTabPane} from 'element-plus';
import defaultLayout from '../default_layout.json';

const props = defineProps(['modelValue']);
const emit = defineEmits(['update:modelValue', 'entityCreated']);
const state = inject($state);

onUpdated(() => {
  console.log('entity updated');
});
onMounted(() => {
  console.log('mounted');
  //console.log(definitions.value);
});

// const data = reactive({
//   activeLayout: ''
// });

// watch(() => props.modelValue, (newVal, oldVal) => {
//   data.activeLayout = state.meta[newVal['@id']].__activeLayout ??= 'About';
// }, { immediate: true });
const activeGroup = computed({
  get() {
    return state.meta[props.modelValue['@id']]?.__activeLayout || 'About';
  },
  set(val) {
    const cache = state.meta[props.modelValue['@id']] ??= {};
    cache.__activeLayout = val;
  }
});
const definitions = computed(() => state.getDefinitions(props.modelValue));
//const definitions = computed(() => {console.log(props.modelValue['@id']); return state.getDefinitions(props.modelValue)});

// create a multi map for indexing definitions by name
// const definitionMap = computed(() => Object.values(definitions.value).reduce((r, d) =>
//   (r.has(d.name) ? r.get(d.name).push(d) : r.set(d.name, [d]), r), new Map()
// ));

const layouts = computed(() => {
  // console.log('layouts:', definitions.value);
  /** @type {string[]} */
  const types = props.modelValue['@type'] || [];
  const layoutsByType = state.profile?.layouts || {};
  // handle the case of multiple types
  // pick the last type that has layout defined
  let layouts = types.reduce((l, t) => layoutsByType[t] || l, null) ||
      state.profile?.inputGroups || defaultLayout;
  const others = {name: 'Others', description: '', definitions: []};
  layouts = layouts.concat(others);

  const inputMap = layouts.reduce((r, l, i) => {
    l.definitions = [];
    for (const input of (l.inputs ?? [])) r.set(input, i);
    return r;
  }, new Map());

  for (const key in definitions.value) {
    const d = definitions.value[key];
    const i = inputMap.get(d.name);
    const defs = (i == null) ? others.definitions : layouts[i].definitions;
    defs.push(d);
  }
  // console.log(layouts);
  return layouts.map((layout) => {
    layout.disabled = !layout.definitions.length;
    return layout;
  });
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
  <ElTabs tab-position="left" v-model="activeGroup">
    <ElTabPane v-for="(layout, i) in layouts" :label="layout.name" :name="layout.name"
               :disabled="layout.disabled">
      <template #label>
        <el-popover v-if="layout.disabled"
                    placement="right-end"
                    :title="layout.name"
                    :width="300"
                    trigger="hover"
                    content="There are no properties available in the profile for this type"
        >
          <template #reference>
            {{ layout.name }}
          </template>
        </el-popover>
        <span v-else>
          {{ layout.name }}
        </span>
      </template>
      <el-form id="#entityForm" label-width="auto" novalidate v-if="activeGroup === layout.name">
        <Property v-for="def in layout.definitions" :key="def.id" :modelValue="getProperty(def)"
                  :components="getComponents(def)" :definition="def" @update:modelValue="v => updateProperty(def, v)"
                  @entityCreated="(e) => $emit('entityCreated', e)"></Property>
      </el-form>
    </ElTabPane>
  </ElTabs>
</template>