<script setup>
import {onMounted, onUpdated, reactive} from "vue";

const pageSize = 10;
const props = defineProps(['value']);

const data = reactive({
  values: [],
  pageStartIndex: 0,
  currentPage: 1,
  filteredValues: []
});
onMounted(() => {
  data.filteredValues = props.value;
});
onUpdated(() => {
  data.filteredValues = props.value;
});

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
                   :total="value.length"
                   @current-change="updatePages"
    />
  </el-row>
  <el-button :gutter="10" v-if="data.filteredValues"
             v-for="v in data.filteredValues?.slice(data.pageStartIndex, data.pageStartIndex + pageSize)"
             @click="$emit('updateRoute', v['@id'])"
             v-show="v['@id'] !== 'ro-crate-metadata.json'"
             class="w-full my-2 p-2 min-h-fit break-words"
             style="padding: 2em;min-height: fit-content;white-space: break-spaces;word-wrap: break-word;">
    <p class="break-words m-2">
      <i class="fa-solid fa-arrow-left"></i>&nbsp;
      <span v-if="v?.['@type']">
        <b>{{ v['@type'].join(', ') }}</b>:
        </span>
      &nbsp;{{ v['name']?.[0] || v['@id'] }}
    </p>
  </el-button>
</template>