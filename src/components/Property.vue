<script setup>
import { reactive, computed, toRaw } from "vue";
import { DataStore, resolveComponent, getPrimitiveComponent } from '../stores/data';
import { QuestionFilled, Delete, InfoFilled } from '@element-plus/icons-vue';
import ControlAdd from "./ControlAdd.vue";
const pageSize = 10; //Later do in conf the page size

const props = defineProps({
  modelValue: { type: [String, Array] },
  definition: { type: Object, required: true }
});
const emit = defineEmits(['update:modelValue']);

const label = computed(() => {
  var label = props.definition.name;
  var namespace;
  if (!label) {
    label = props.definition.id;
    try {
      const url = new URL(label);
      label = url.pathname.split('/').pop();
    } catch (error) { }
  } else {
    let m = label.match(/(.+):(.+)/);
    if (m) [, namespace, label] = m;
  }
  label = label.charAt(0).toUpperCase() + label.slice(1);
  return label.replace(/([a-z])([A-Z])/g, '$1 $2');
});

const values = computed(() => {
  /**
   * @type {string|object[]}
   */
  const value = props.modelValue;
  return value ? (Array.isArray(value) ? value : [value]) : [];
});
const valueIndexes = computed(() => Array.from(values.value.keys()));
const indexes = computed(() => {
  let filtered = valueIndexes.value;
  if (data.keyword) {
    let re = new RegExp(data.keyword.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&'), "i");
    filtered = valueIndexes.value.filter(i => {
      const v = values.value[i];
      return (v['@id'] ? [v.name?.[0], v['@id']] : [v]).reduce((r, text) =>
        r ||= (text && text.match(re)), false);
    });
  }
  return filtered;
});

var components = [];
const rows = computed(() => {
  //console.log('get rows ', label.value);
  let start = (data.currentPage - 1) * data.pageSize;
  let end = start + data.pageSize;
  if (end > indexes.value.length) end = indexes.value.length;
  let result = [];
  for (let i = start; i < end; ++i) {
    let index = indexes.value[i];
    let value = values.value[index];
    var c = components[index] ?? (components[index] = resolveComponent(value, props.definition));
    //console.log(value);
    if (c) result.push([index, value, ...c]);
  }
  return result;
});

const data = reactive({
  currentPage: 1,
  keyword: '',
  pageSize: pageSize
});

function addValue(type) {
  //props.modelValue.push();
  const vals = toRaw(props.modelValue);
  if (!Array.isArray(vals)) return;
  const options = props.definition.values;
  const propsOpt = {...props.definition.props, ...(options && { options })};
  console.log(props.definition)
  var c = getPrimitiveComponent(type, propsOpt);
  console.log(c);
  if (c) {
    let len = vals.push('');
    components[len - 1] = c;
    //console.log('addValue');
    //console.log(vals);
    emit('update:modelValue', vals);
  }
}

function addEntity(e) {
  //const vals = toRaw(props.modelValue);
  const vals = props.modelValue;
  if (!Array.isArray(vals)) return;
  let len = vals.push(e);
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
  vals.splice(i, 1);
  emit('update:modelValue', vals);
}
function filterValues() {
  data.currentPage = 1;
}

function mapIndex(i) {
  let index = i - 1 + (data.currentPage - 1) * data.pageSize;
  return indexes.value[index];
}
</script>

<template>
  <el-form-item class="hover:bg-violet-200 p-2">
    <template #label>
      <span class="mr-1" :title="definition.id">{{ label }} </span>
      <el-icon :title="definition.help">
        <InfoFilled />
      </el-icon>
    </template>
    <div class="flex flex-col flex-grow">
      <div v-if="values.length > data.pageSize" class="flex flex-row flex-nowrap mb-3">
        <el-input v-model="data.keyword" placeholder="Enter keyword to filter the values" clearable
          @input="filterValues" />
        <el-pagination v-model:current-page="data.currentPage" v-model:page-size="data.pageSize"
          layout="prev, pager, next, total" :total="indexes.length" />
      </div>

      <div v-for="[i, value, component, p] of rows" class="flex flex-row flex-nowrap mb-3" :key="i">
        <component :is="component" v-bind="p" :modelValue="value" @update:modelValue="value => updateValue(i, value)">
        </component>
        <div class="pl-2 flex flex-nowrap">
          <el-button :disabled="definition.min > i" @click="removeValue(i)" type="danger" plain :icon="Delete"
            :class="{ invisible: definition.min > i }" size="small"></el-button>
          <el-button size="small" :icon="QuestionFilled" type="info" plain></el-button>
        </div>
      </div>

      <ControlAdd :modelValue="values" :definition="definition" class="flex flex-row flex-nowrap" @add="addValue" @addEntity="addEntity">
      </ControlAdd>
    </div>
  </el-form-item>
</template>

