<script setup>
import { reactive, computed } from "vue";

const props = defineProps({
  modelValue: { type: Array }
});
const emit = defineEmits(['update:modelValue']);

const pageSize = 10; //Later do in conf the page size

const data = reactive({
  currentPage: 1,
  keyword: '',
  pageSize: pageSize
});

/** An array that contains the indexes of original data, eg [1,2,3,...]  */
const indexes = computed(() => Array.from(props.modelValue.keys()));

/** An array that contains the indexes of filtered data, eg [2,7,8...]  */
const filteredIndexes = computed(() => {
  let filtered = indexes.value;
  if (data.keyword) {
    let re = new RegExp(data.keyword.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&'), "i");
    filtered = indexes.value.filter(i => {
      const v = props.modelValue[i];
      return (v['@id'] ? [v.name?.[0], v['@id']] : [v]).reduce((r, text) =>
        r ||= (text && text.match(re)), false);
    });
  }
  return filtered;
});

const pagedIndexes = computed(() => {
  let start = (data.currentPage - 1) * data.pageSize;
  let end = start + data.pageSize;
  if (end > filteredIndexes.value.length) {
    end = filteredIndexes.value.length;
  }
  let result = [];
  for (let i = start; i < end; ++i) {
    let index = indexes.value[i];
    //let value = props.modelValue[index];
    result.push(index);
  }
  return result;
});

function filterValues() {
  data.currentPage = 1;
}


</script>

<template>
  <div v-if="modelValue.length > data.pageSize" class="flex flex-row flex-nowrap mb-3">
    <el-input v-model="data.keyword" placeholder="Enter keyword to filter the values" clearable
      @input="filterValues" />
    <el-pagination v-model:current-page="data.currentPage" v-model:page-size="data.pageSize"
      layout="prev, pager, next, total" :total="filteredIndexes.length" />
  </div>

  <div v-for="i of pagedIndexes" class="flex flex-row flex-nowrap mb-3" :key="i">
    <slot :index="i" :value="modelValue[i]"></slot>
  </div>
</template>
