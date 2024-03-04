<script setup>
import { reactive, computed, markRaw, inject } from "vue";
import { Plus, Close } from '@element-plus/icons-vue';
import { $state } from './keys';
import { sortedUniq, sortBy } from 'lodash';
import { ElSelect, ElOption, ElOptionGroup, ElButton, ElIcon } from 'element-plus';

const props = defineProps({
  /** The full property values */
  modelValue: { type: Array, required: true },
  definition: { type: Object, required: true }
});

const emit = defineEmits(['update:modelValue', 'add']);

const state = inject($state);
const types = computed(() => {
  if (props.definition?.type) {
    let types = [];
    for (let classType of props.definition.type || []) {
      if (state.profile.classes[classType]) {
        // console.log(state.profile.classes[classType]?.['hasSubclass'])
        types = types.concat(state.profile.classes[classType]?.['hasSubclass'] || [])
      }
    }
    return props.definition.type.concat(sortedUniq(sortBy(types)));
  }
  return ['Text', 'Number', 'Entity'];
});

const data = reactive({
  selectedType: '',
  keyword: '',
  options: [
    { value: 'local', label: 'Add an entity already defined in this crate', options: [] },
    { value: 'lookup', label: 'Add an entity defined externally', options: [] },
  ],
  loading: false,
  entity: null
});

const vFocus = { mounted: (el, binding, vnode) => el.getElementsByTagName('input')[0].focus() };
//const searchInput = ref();

//var options = [{ value: 1, label: 'a' }, { value: 2, label: 'b' }];

function add(type) {
  if (state.isInline(type)) {
    let defVal;
    if (!state.isPrimitive(type)) {
      defVal = createEntity(type);
    }
    emit('add', type, defVal);
  } else {
    if (data.selectedType == type) {
      data.selectedType = '';
    } else {
      data.selectedType = type;
    }
    //   data.selectedType = type;
    //   addNewEntity();
    //   data.selectedType = '';
  }
}

function createEntity(type, name) {
  console.log('createEntity');
  let id = '';
  let cleanName = '';
  if (!name) {
    name = type;
  }
  cleanName = name.replace(/\W/g, "_");
  id = state.crate.uniqueId(`#${cleanName}-`);
  return {
    "@id": id,
    "@type": type,
    name: id.substring(1)
  };
}

function addEntity(v) {
  console.log('addEntity');
  const type = data.selectedType;
  data.keyword = '';
  data.selectedType = '';
  emit('add', type, v, true);
}

function addNewEntity() {
  const type = data.selectedType;
  const e = createEntity(type, data.keyword);
  data.keyword = '';
  data.selectedType = '';
  emit('add', type, e);
}

function search(query) {
  console.log(query);
  if (!query) {
    data.options[0].options = [];
    data.options[1].options = [];
    //return;
    return setTimeout(() => data.keyword = '', 100);
  }
  data.keyword = query;
  const type = [].concat(data.selectedType);
  // local search
  const qRegex = new RegExp(query, 'i');
  //filter: { '@type': new RegExp(type, 'i') }
  const it = state.crate.entities({
    filter: e =>
      e['@id'] !== state.metadataFileEntityId &&
      type.every(t => e['@type'].includes(t)) &&
      (e.name ?? []).concat(e['@id']).some(v => qRegex.test(v))
  });
  const localOptions = Array.from(it);
  //console.log(localOptions);
  data.options[0].options = markRaw(localOptions);
  // remote search
  data.loading = true;
  state.remoteSearch(type[0], query).then(result => {
    //console.log(result);
    data.options[1].options = markRaw(result);
    data.loading = false;
  });
}

function createLabel(entity) {
  return ([].concat(entity.name))[0] || entity['@id'];
}

function typeLabel(type) {
  return Array.isArray(type) ? type.join('+') : type;
}
</script>

<template>
  <div v-if="!definition.max || !modelValue.length || definition.max > 1">
    <!-- Add buttons -->
    <el-select v-if="types.length > 1" :modelValue="data.selectedType" @clear="data.selectedType = ''"
      placeholder="Choose a type" size="small" clearable filterable style="--el-select-width: 200px;">
      <template #prefix>
        <el-icon>
          <Plus />
        </el-icon>
      </template>
      <el-option v-for="t of types" :label="typeLabel(t)" :value="t" @click="add(t)">
        {{ typeLabel(t) }}
      </el-option>
    </el-select>
    <el-button v-else v-for="t of types" size="small" type="primary" :icon="data.selectedType === t ? Close : Plus"
      :class="{ active: data.selectedType === t }" @click="add(t)">
      {{ typeLabel(t) }}
    </el-button>
    <!-- search input -->
    <template v-if="data.selectedType">
      <el-select v-focus class="flex-grow min-w-[100px]" filterable remote clearable v-model="data.entity" value-key="@id"
        :loading="data.loading" @change="addEntity" :remote-method="search" size="small" @keyup.enter="addNewEntity">
        <template v-for="group in data.options" :key="group.value">
          <el-option-group v-if="group.options.length" :label="group.label">
            <el-option v-for="item in group.options" :key="item['@id']" :label="createLabel(item)" :value="item">
              <!-- <span class="italic">[{{ data.selectedType }}]&nbsp;</span> -->
              <span class="font-bold">{{ createLabel(item) }}</span>
            </el-option>
          </el-option-group>
        </template>
      </el-select>
      <el-button class="add-new-entity" size="small" type="success" @click="addNewEntity">
        Create new {{ typeLabel(data.selectedType) }}<span v-if="data.keyword">:&nbsp;</span>
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