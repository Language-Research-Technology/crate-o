<script setup>
import { reactive, computed, toRaw, nextTick, inject } from "vue";
import { QuestionFilled, Delete, InfoFilled } from '@element-plus/icons-vue';
import ControlAdd from "./ControlAdd.vue";
import { $state } from './keys';
const state = inject($state);
const pageSize = 10; //Later do in conf the page size

const props = defineProps({
  modelValue: {},
  components: { type: Array, required: true },
  definition: { type: Object, required: true }
});
const emit = defineEmits(['update:modelValue']);

const label = computed(() => {
  var label = props.definition.label || props.definition.name || props.definition.id;
  if (typeof label !== 'string') label = 'error';
  var namespace;
  var isUrl;
  try {
    const url = new URL(label);
    if (url.host) {
      label = url.pathname.split('/').pop();
      isUrl = true;
    }
  } catch (error) {
  }
  if (!isUrl) {
    let m = label.match(/(.+):(.+)/);
    if (m) [, namespace, label] = m;
  }
  label = label.charAt(0).toUpperCase() + label.slice(1);
  return label.replace(/([a-z])([A-Z])/g, '$1 $2');
});

const values = computed(() => {
  const value = /** @type {string|object[]} */(props.modelValue);
  return value ? (Array.isArray(value) ? value : [value]) : [];
});

function add(type, entity) {
  //props.modelValue.push();
  var vals = toRaw(props.modelValue);
  console.log(props.definition)
  console.log('addValue', type, entity);
  console.log(vals);
  var len;
  //console.log(c);
  if (Array.isArray(vals)) {
    len = vals.push(entity || '');
  } else {
    vals = entity || '';
    len = 1;
  }
  emit('update:modelValue', vals);
  if (entity) {
    entity = state.crate.getEntity(entity['@id']);
    state.entities.push(entity);
  }
  if (state.isInline(type)) {
    const options = props.definition.values;
    const propsOpt = { ...props.definition.props, ...(options && { options }) };
    props.components[len - 1] = state.getInlineComponent(type, propsOpt);
    console.log(props.components[len - 1]);
  }
}

function updateValue(i, value) {
  const vals = toRaw(props.modelValue);
  if (Array.isArray(vals)) {
    vals[i] = value;
    emit('update:modelValue', vals);
  } else {
    emit('update:modelValue', value);
  }
}

function removeValue(i, value) {
  const vals = toRaw(props.modelValue);
  if (Array.isArray(vals)) {
    vals.splice(i, 1);
    props.components.splice(i, 1);
    if (typeof value === 'object' && value['@id']) {
      // count all reverse links
      var linksCount = Object.values(value['@reverse']).reduce((count, refs) => count + refs.length, 0);
      if (!linksCount) {
        //todo: confirm to delete entity
        const i = state.entities.findIndex(e => e['@id'] === value['@id']);
        if (i >= 0) state.entities.splice(i, 1);
        nextTick(() => {
          state.crate.deleteEntity(value);
        });
      }
    }
    emit('update:modelValue', vals);
  }
}

</script>

<template>
  <el-form-item class="hover:bg-violet-100 px-2 p-2">
    <template #label>
      <span class="mr-1" :title="definition.id">{{ label }} </span>
      <el-icon :title="definition.help">
        <InfoFilled />
      </el-icon>
    </template>
    <div class="flex flex-col flex-grow">
      <FilteredPaged :modelValue="values" v-slot="{ value, index }">
        <template
          v-for="[component, componentProps] of [(components[index] ??= state.resolveComponent(value, definition))]">
          <component :is="component" v-bind="componentProps" :modelValue="value"
            @update:modelValue="value => updateValue(index, value)">
          </component>
        </template>
        <div class="pl-2 flex flex-nowrap">
          <!-- Delete Button -->
          <el-button :disabled="definition.min >= values.length" @click="removeValue(index, value)" type="danger" plain
            :icon="Delete" :class="{ invisible: definition.min >= values.length }" size="small"></el-button>
          <!-- <el-button size="small" :icon="QuestionFilled" type="info" plain></el-button> -->
        </div>
      </FilteredPaged>

      <ControlAdd :modelValue="values" :definition="definition" class="flex flex-row flex-nowrap" @add="add">
      </ControlAdd>
    </div>
  </el-form-item>
</template>

<style>
.el-form-item {
  margin-bottom: 0px;
}
</style>