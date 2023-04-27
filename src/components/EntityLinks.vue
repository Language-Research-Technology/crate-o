<script setup>
import {onMounted, onUpdated, reactive} from "vue";

const pageSize = 10;
const props = defineProps(['value', 'icon']);

const data = reactive({
  values: [],
  pageStartIndex: 0,
  currentPage: 1,
  filteredValues: [],
  filter: undefined,
});
onMounted(() => {
  data.filteredValues = props.value;
  data.values = props.value;
});
onUpdated(() => {
  //data.filteredValues = data.values;
});

function filterValues() {
  data.filteredValues = data.values.filter((v) => {
    return v.name?.[0].match(new RegExp(data.filter, "i"));
  });
  updatePages(1);
}

const emit = defineEmits(['updateRoute'])

function updateRoute(id) {
  emit('updateRoute', id);
}

function updatePages(page) {
  data.pageStartIndex = (page - 1) * 10;
}

</script>
<template>
  <el-row v-if="Array.isArray(value) && value.length > pageSize"
          class="w-full">
    <el-pagination class="items-center"
                   v-model:currentPage="data.currentPage"
                   layout="prev, pager, next"
                   :total="data.filteredValues.length"
                   @current-change="updatePages"
    />
    <el-input
        v-model="data.filter"
        :placeholder="'Search in '"
        clearable
        @input="filterValues"
    />
  </el-row>
  <div :gutter="10" v-if="data.filteredValues"
             v-for="v in data.filteredValues?.slice(data.pageStartIndex, data.pageStartIndex + pageSize)"
             @click="$emit('updateRoute', v['@id'])"
             v-show="v['@id'] !== 'ro-crate-metadata.json'"
             class="w-full my-2 p-1 min-h-fit break-words border-2 rounded bg-indigo-200 hover:bg-indigo-400 cursor-pointer">
    <p class="break-words m-2">
      <i :class="'fa-solid ' + props.icon "></i>&nbsp;
      <span v-if="v?.['@type']">
        <b>{{ v['@type'].join(', ') }}</b>:
        </span>
      &nbsp;{{ v['name']?.[0] || v['@id'] }}
    </p>
  </div>
</template>