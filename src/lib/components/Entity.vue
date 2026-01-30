<script setup>
import { computed, inject, onMounted, onUpdated, reactive, watch } from "vue";
import { ElTabPane, ElTabs, ElTooltip, ElPopover, ElIcon, ElRow, ElForm, ElFormItem, ElButton } from 'element-plus';
import { InfoFilled, Plus } from '@element-plus/icons-vue';
import { $state } from './keys';
import Property from './Property.vue';
import defaultLayout from './default_layout.json';
import MediaPreview from "./MediaPreview.vue";

const props = defineProps(['modelValue', 'propertyId', 'getFile']);
const emit = defineEmits(['update:modelValue']);
const state = inject($state);


// onUpdated(() => {
//   console.log('entity updated');
// });
// onMounted(() => {
//   console.log('mounted');
//   //console.log(definitions.value);
// });

const data = reactive({
  file: null
});

const layouts = computed(() => {
  const entity = props.modelValue;
  const definitions = state.getDefinitions(entity);
  /** @type {string[]} */
  const types = entity['@type'] || [];
  const layoutsByType = state.profile?.layouts || {};
  // handle the case of multiple types, pick the first one that specifies a layout
  /** @type {({ name: string, help: string, disabled: boolean, inputs: Array, definitions: Array }[])} */
  let layouts = layoutsByType[types.find(t => layoutsByType[t])] || state.profile?.inputGroups || defaultLayout;

  const othersProps = new Set(Object.keys(definitions));
  //console.log(layouts);
  for (const l of layouts) {
    const defs = l.definitions = [];
    for (const id of (l.inputs ?? [])) {
      const d = definitions[id];
      if (d) {
        defs.push(d);
        othersProps.delete(id);
      }
    }
    l.disabled = !defs.length;
  }
  // put the rest in others tab
  const inputs = Array.from(othersProps);
  const others = {
    name: 'Others',
    help: 'Other properties not in the above categories',
    inputs,
    definitions: inputs.map(id => definitions[id]),
    disabled: !inputs.length
  };

  return layouts.concat(others);
});

const activeGroup = computed({
  get() {
    //console.log('get:currentProperty', props.currentProperty)
    return state.meta[props.modelValue['@id']]?.__activeLayout || 'About';
  },
  set(val) {
    const cache = state.meta[props.modelValue['@id']] ??= {};
    cache.__activeLayout = val;
  }
});

watch(() => props.modelValue, async (entity) => {
  data.file = null;
  if (entity['@type'].includes('File') && props.getFile) {
    data.file = await props.getFile(props.modelValue['@id']);
  }
}, { immediate: true });

watch(() => props.propertyId, (propertyId) => {
  if (propertyId) {
    const name = layouts.value.find(l => l.inputs.includes(propertyId))?.name;
    if (name) activeGroup.value = name;
  }
}, { immediate: true });

//const definitions = computed(() => {console.log(props.modelValue['@id']); return state.getDefinitions(props.modelValue)});

// create a multi map for indexing definitions by name
// const definitionMap = computed(() => Object.values(definitions.value).reduce((r, d) =>
//   (r.has(d.name) ? r.get(d.name).push(d) : r.set(d.name, [d]), r), new Map()
// ));


function updateProperty(def, value) {
  state.ensureContextHasTerm(def);
  const entity = props.modelValue;
  const key = def.key || def.name;
  emit('update:modelValue', entity, key, value);
}

function getProperty(def) {
  // console.log('getProperty', def.name);
  // console.log('def.id', def.id);
  // console.log('def.name', def.name);
  // console.log('def.key', def.key);
  const entity = props.modelValue;
  const key = def.key || def.name;
  if (def?.isReverse) {
    return entity['@reverse'][key];
  }
  return entity[key];
}

function getComponents(def) {
  const entity = props.modelValue;
  return state.getComponents(entity['@id'], def.id);
}

function checkRootTypes() {
  const specialTypesExpected = state.profile?.rootDataset?.type
  const extraTypesNeeded = [];

  if (specialTypesExpected) {
    for (let pType of specialTypesExpected) {
      if (!state.crate.rootDataset["@type"].includes(pType)) {
        extraTypesNeeded.push(pType);
      }
    }
  }
  return extraTypesNeeded;
}


function addRootTypes(rTypes) {
  const entity = props.modelValue;
  emit('update:modelValue', entity, '@type', entity['@type'].concat(rTypes));
}

function checkConformsTo() {
  const specialConformsToExpected = state.profile?.conformsToUri || [];
  const extraConformsToNeeded = [];

  if (specialConformsToExpected) {
    const cT = [];
    for (let c of state.crate.rootDataset["conformsTo"] || []) {
      if (c && c['@id']) {
        cT.push(c['@id']);
      }
    }
    for (let conformsTo of specialConformsToExpected) {
      if (!cT.includes(conformsTo)) {
        extraConformsToNeeded.push({ "@id": conformsTo });
      }
    }
  }
  return extraConformsToNeeded;
}

function addConformTos(rTypes) {
  const entity = props.modelValue;
  const newVal = entity.conformsTo ? entity.conformsTo.concat(rTypes) : rTypes;
  emit('update:modelValue', entity, 'conformsTo', newVal);
}

</script>

<template>
  <el-tabs tab-position="left" v-model="activeGroup">
    <el-tab-pane v-for="(layout, i) in layouts" :label="layout.name" :name="layout.name" :disabled="layout.disabled">
      <template #label>
        <el-tooltip placement="right-end" effect="light">
          <template #content>
            <div class="text-slate-700">
              <h4 class="text-base">{{ layout.name }}</h4>
              <p v-if="layout.help">{{ layout.help }}</p>
              <p class="font-semibold" v-if="layout.disabled">There are no properties available in the mode for this type
              </p>
            </div>
          </template>
          <div>
            {{ layout.name }}
          </div>
        </el-tooltip>
      </template>
      <el-form id="#entityForm" label-width="auto" novalidate v-if="activeGroup === layout.name">
        <div v-if="state.crate.rootDataset['@id'] === props.modelValue['@id']">
          <el-row v-if="checkRootTypes().length > 0"
            class="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4">
            This dataset does not have all the types required in the selected Mode:
            <el-button size="small" type="primary" :icon="Plus" @click="addRootTypes(checkRootTypes())">
              Add the missing type(s): {{ checkRootTypes().join(", ") }}
            </el-button>
          </el-row>
          <el-row v-if="checkConformsTo().length > 0"
            class="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4">
            This dataset does not have all the conformsTos required in the selected Mode:&nbsp;
            <el-button size="small" type="primary" :icon="Plus" @click="addConformTos(checkConformsTo())">
              Add the missing conformsTo(s):&nbsp;<span v-for="c of checkConformsTo()">{{ c?.['@id'] }}</span>
            </el-button>
          </el-row>
        </div>

        <Property v-for="def in layout.definitions" :key="def.id" :model-value="getProperty(def)"
          :components="getComponents(def)" :definition="def" @update:model-value="v => updateProperty(def, v)">
        </Property>

      </el-form>
    </el-tab-pane>

    <el-tab-pane v-if="data.file" label="Preview" name="Preview">
      <MediaPreview :file="data.file" />
    </el-tab-pane>

  </el-tabs>
</template>