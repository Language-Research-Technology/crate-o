<script setup>
import { reactive, computed, markRaw, inject } from "vue";
import { Plus, Close } from '@element-plus/icons-vue';
import { ElSelect, ElOption, ElOptionGroup, ElButton, ElIcon } from 'element-plus';
import { PropertyDefinition } from "./EditorState";

/** @typedef {({'@id':string,name:string[]})} Entity */ 

const props = defineProps({
  definition: { type: PropertyDefinition, required: true },
  localSearch: { 
    /** @type import('vue').PropType<(types:string[],query:string) => Entity[]> */
    type: Function, 
    required: true 
  },
  remoteSearch: {
    /** @type import('vue').PropType<(types:string[],query:string) => Promise<Entity[]>> */
    type: Function,
    required: false,
    default: async () => (types, query) => []
  }
});

const emit = defineEmits(['add']);

const types = computed(() => props.definition.expectedTypes);

const data = reactive({
  selectedType: '',
  keyword: '',
  localOptions: { value: 'local', label: 'Add an entity already defined in this crate', options: [] },
  remoteOptions: { value: 'lookup', label: 'Add an entity defined externally', options: [] },
  options: [],
  loading: false,
  entity: null
});

data.options = [data.localOptions, data.remoteOptions];

const vFocus = { mounted: (el, binding, vnode) => el.getElementsByTagName('input')[0].focus() };
//const searchInput = ref();

//var options = [{ value: 1, label: 'a' }, { value: 2, label: 'b' }];

/**
 * 
 * @param type {import("./EditorState").TypeDefinition} 
 */
function add(type) {
  if (type.isInline) {
    let defVal;
    if (!type.isPrimitive) {
      defVal = createEntity(type);
    }
    emit('add', type, defVal);
  } else {
    if (data.selectedType == type.label) {
      data.selectedType = '';
    } else {
      data.selectedType = type.label;
    }
  }
}

function createEntity(type, name) {
  return {
    "@type": type.types,
    name
  };
}

function addEntity(v) {
  console.log('addEntity');
  const type = types.value.find(t => data.selectedType === t.label);
  //const type = data.selectedType;
  data.keyword = '';
  data.selectedType = '';
  data.entity = null;
  emit('add', type, v, true);
}

function addNewEntity() {
  const type = types.value.find(t => data.selectedType === t.label);
  const e = createEntity(type, data.keyword);
  data.keyword = '';
  data.selectedType = '';
  emit('add', type, e);
}

function createLabel(entity) {
  return ([].concat(entity.name))[0] || entity['@id'];
}

function search(query) {
  data.loading = true;
  console.log(query);
  if (!query) {
    data.localOptions.options = data.remoteOptions.options = [];
    return setTimeout(() => data.keyword = '', 100);
  }
  data.keyword = query;
  const localOptions = props.localSearch([].concat(data.selectedType), query);
  data.localOptions.options = markRaw(localOptions);
  // remote search
  props.remoteSearch([].concat(data.selectedType), query).then(remoteOptions => {
    data.remoteOptions.options = markRaw(remoteOptions);
    data.loading = false;
  });
}
</script>

<template>
  <div class="cc-property-add-value flex flex-col md:flex-row gap-1 flex-nowrap mb-3">
    <!-- Add buttons -->
    <el-select v-if="types.length > 1" :modelValue="data.selectedType" 
      @clear="data.selectedType = ''" placeholder="Choose a type" clearable filterable style="--el-select-width: 200px;">
      <template #prefix>
        <el-icon>
          <Plus />
        </el-icon>
      </template>
      <el-option v-for="t of types" :label="t.label" :value="t.name" @click="add(t)">
        {{ t.label }}
      </el-option>
    </el-select>
    <el-button v-else v-for="t of types" type="primary" :icon="data.selectedType === t.label ? Close : Plus"
      :class="{ active: data.selectedType === t.label }" @click="add(t)">
      {{ t.label }}
    </el-button>
    <!-- search input -->
    <template v-if="data.selectedType">
      <el-select v-focus class="flex-grow min-w-[100px]" filterable remote clearable v-model="data.entity"
        value-key="@id" :loading="data.loading" @change="addEntity" :remote-method="search" @keyup.enter="addNewEntity">
        <template v-for="group in data.options" :key="group.value">
          <el-option-group v-if="group.options.length" :label="group.label">
            <el-option v-for="item in group.options" :key="item['@id']" :label="createLabel(item)" :value="item">
              <!-- <span class="italic">[{{ data.selectedType }}]&nbsp;</span> -->
              <span class="font-bold">{{ createLabel(item) }}</span>
            </el-option>
          </el-option-group>
        </template>
      </el-select>
      <el-button class="add-new-entity" type="success" @click="addNewEntity">
        Create new {{ data.selectedType }}<span v-if="data.keyword">:&nbsp;</span>
        {{ data.keyword }}</el-button>
    </template>
  </div>
</template>

<style>
.el-button.add-new-entity {
  @media (min-width: 768px) {
    max-width: 35%;
  }
}

.el-button.add-new-entity>span {
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  display: inline;
}

.el-button.active {
  color: var(--el-button-active-text-color);
  border-color: var(--el-button-active-border-color);
  background-color: var(--el-button-active-bg-color);
  outline: 0;
}
</style>