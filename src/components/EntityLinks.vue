<script setup>
import {onMounted, computed, reactive} from "vue";

const pageSize = 10;
const props = defineProps(['value', 'icon']);

const data = reactive({
  pageStartIndex: 0,
  currentPage: 1,
  filter: undefined,
});

const filteredValues = computed(() =>
  props.value.filter((v) => {
    return v.name?.[0].match(new RegExp(data.filter, "i"));
  })
);

const emit = defineEmits(['updateRoute']);

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
                   :total="filteredValues.length"
                   @current-change="updatePages"
    />
    <el-input
        v-model="data.filter"
        :placeholder="'Search in '"
        clearable
        @input="updatePages(1)"
    />
  </el-row>
  <div v-if="filteredValues"
             v-for="v in filteredValues?.slice(data.pageStartIndex, data.pageStartIndex + pageSize)"
             @click="$emit('updateRoute', v['@id'])"
             v-show="v['@id'] !== 'ro-crate-metadata.json'"
             class="w-full my-2 p-1 min-h-fit break-words border-2 rounded bg-indigo-200 hover:bg-indigo-400 cursor-pointer">
    <p class="break-words m-2 text-indigo-800">
      <i :class="'fa-solid ' + props.icon "></i>&nbsp;
      <span v-if="v?.['@type']">
        <b>{{ v['@type'].join(', ') }}</b>:
        </span>
      &nbsp;{{ v['name']?.[0] || v['@id'] }}
    </p>
  </div>
</template>