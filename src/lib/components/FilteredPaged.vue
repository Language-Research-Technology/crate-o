<script setup>
import { reactive, computed } from 'vue';
import { ElInput, ElPagination, ElSelect, ElOption } from 'element-plus';

const ALL_TYPES_VALUE = '__all_types__';

const props = defineProps({
  modelValue: { 
    /** @type import('vue').PropType<any[]> */
    type: Array 
  }
});
const emit = defineEmits(['update:modelValue']);

const pageSize = 10; //Later do in conf the page size

const data = reactive({
  currentPage: 1,
  keyword: '',
  selectedType: ALL_TYPES_VALUE,
  pageSize: pageSize
});

function extractTypes(value) {
  if (!value || typeof value !== 'object') {
    return [];
  }

  const rawType = value['@type'];
  if (Array.isArray(rawType)) {
    return rawType.map((t) => (typeof t === 'object' ? t?.['@id'] : t)).filter(Boolean);
  }

  if (rawType && typeof rawType === 'object') {
    return rawType['@id'] ? [rawType['@id']] : [];
  }

  return rawType ? [rawType] : [];
}

const typeOptions = computed(() => {
  const types = new Set();
  for (const value of props.modelValue || []) {
    for (const typeName of extractTypes(value)) {
      types.add(typeName);
    }
  }

  return [
    { value: ALL_TYPES_VALUE, label: 'All types' },
    ...Array.from(types).sort().map((typeName) => ({ value: typeName, label: typeName })),
  ];
});

/** An array that contains the indexes of original data, eg [1,2,3,...]  */
const indexes = computed(() => Array.from(props.modelValue.keys()));

/** An array that contains the indexes of filtered data, eg [2,7,8...]  */
const filteredIndexes = computed(() => {
  let filtered = indexes.value;

  if (data.selectedType !== ALL_TYPES_VALUE) {
    const values = props.modelValue;
    filtered = filtered.filter((i) => extractTypes(values[i]).includes(data.selectedType));
  }

  if (data.keyword) {
    let re = new RegExp(data.keyword.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&'), "i");
    const values = props.modelValue;
    filtered = filtered.filter(i => {
      const val = values[i];
      const fields = val['@id'] ? (val.name??[]).concat(val['@id'], val['@type']) : [val];
      for (const text of fields) {
        return text && text.match(re);
      }
    });
    //console.log(filtered.map(i => values[i].name));
  }
  return filtered;
});

const pagedIndexes = computed(() => {
  let start = (data.currentPage - 1) * data.pageSize;
  let end = start + data.pageSize;
  if (end > filteredIndexes.value.length) {
    end = filteredIndexes.value.length;
  }
  return filteredIndexes.value.slice(start, end);
});

function filterValues() {
  data.currentPage = 1;
}


</script>

<template>
  <div v-if="modelValue.length > data.pageSize" class="filtered-paged flex flex-row flex-wrap mb-3">
    <el-input v-model="data.keyword" placeholder="Find by name" clearable
      @input="filterValues" />
    <el-select v-model="data.selectedType" class="type-filter" @change="filterValues">
      <el-option v-for="option in typeOptions" :key="option.value" :label="option.label" :value="option.value" />
    </el-select>
    <el-pagination v-model:current-page="data.currentPage" v-model:page-size="data.pageSize"
      layout="prev, pager, next, total" :total="filteredIndexes.length" :pager-count="5"/>
  </div>

  <div v-for="i of pagedIndexes" class="flex flex-row flex-nowrap grow mb-3" :key="i">
    <slot :index="i" :value="modelValue[i]"></slot>
  </div>
</template>

<style>
.filtered-paged .el-input {
  width: auto;
  flex-grow: 1;
  min-width: min-content;
}

.filtered-paged .type-filter {
  min-width: 220px;
}
</style>