<script setup>
import { reactive, computed, toRaw } from "vue";
import { DataStore, resolveComponent, getPrimitiveComponent } from '../stores/data';
import { QuestionFilled, Delete, InfoFilled } from '@element-plus/icons-vue';
import ControlAdd from "./ControlAdd.vue";
const pageSize = 10; //Later do in conf the page size

const props = defineProps({
  modelValue: {  },
  components: { type: Array, required: true },
  definition: { type: Object, required: true }
});
const emit = defineEmits(['update:modelValue']);

const label = computed(() => {
  var label = props.definition.label || props.definition.name || props.definition.id;
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

// const valueIndexes = computed(() => Array.from(values.value.keys()));
// const indexes = computed(() => {
//   let filtered = valueIndexes.value;
//   if (data.keyword) {
//     let re = new RegExp(data.keyword.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&'), "i");
//     filtered = valueIndexes.value.filter(i => {
//       const v = values.value[i];
//       return (v['@id'] ? [v.name?.[0], v['@id']] : [v]).reduce((r, text) =>
//         r ||= (text && text.match(re)), false);
//     });
//   }
//   return filtered;
// });

// const rows = computed(() => {
//   const components = props.components;
//   console.log('get rows ', props.definition.id);
//   console.log('components',props.definition.id,JSON.stringify(components));
//   let start = (data.currentPage - 1) * data.pageSize;
//   let end = start + data.pageSize;
//   if (end > indexes.value.length) end = indexes.value.length;
//   let result = [];
//   for (let i = start; i < end; ++i) {
//     let index = indexes.value[i];
//     let value = values.value[index];
//     console.log(components[index]);
//     console.log(value, props.definition.id);
//     var c = components[index] ?? (components[index] = resolveComponent(value, props.definition));
//     console.log(c);
//     //console.log(value);
//     if (c) result.push([index, value, ...c]);
//   }
//   console.log(result);
//   return result;
// });

function addValue(type) {
  //props.modelValue.push();
  var vals = toRaw(props.modelValue);
  const options = props.definition.values;
  const propsOpt = {...props.definition.props, ...(options && { options })};
  //console.log(props.definition)
  //console.log('addValue');
  //console.log(vals);
  var c = getPrimitiveComponent(type, propsOpt);
  var len;
  //console.log(c);
  if (c) {
    if (Array.isArray(vals)) {
      len = vals.push('');
    } else {
      vals = '';
      len = 1;
    }
    //console.log('addValue', c)
    props.components[len - 1] = c;
    emit('update:modelValue', vals);
  }
}

function addEntity(e) {
  //const vals = toRaw(props.modelValue);
  var vals = props.modelValue;
  if (Array.isArray(vals)) vals.push(e);
  else vals = e;
  emit('update:modelValue', vals);
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

function removeValue(i) {
  const vals = toRaw(props.modelValue);
  if (Array.isArray(vals)) {
    vals.splice(i, 1);
    props.components.splice(i, 1);
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
        <template v-for="[component, componentProps] of [(components[index] ??= resolveComponent(value, definition))]">
          <component :is="component" v-bind="componentProps" :modelValue="value" 
              @update:modelValue="value => updateValue(index, value)">
          </component>
        </template>
        <div class="pl-2 flex flex-nowrap">
          <!-- Delete Button -->
          <el-button :disabled="definition.min >= values.length" @click="removeValue(index)" 
            type="danger" plain :icon="Delete"
            :class="{ invisible: definition.min >= values.length }" size="small"></el-button>
          <!-- <el-button size="small" :icon="QuestionFilled" type="info" plain></el-button> -->
        </div>
      </FilteredPaged>

      <ControlAdd :modelValue="values" :definition="definition" class="flex flex-row flex-nowrap" @add="addValue" @addEntity="addEntity">
      </ControlAdd>
    </div>
  </el-form-item>
</template>

<style>
.el-form-item {
  margin-bottom: 0px;
}
</style>