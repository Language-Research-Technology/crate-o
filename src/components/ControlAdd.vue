<script setup>
import { reactive, computed, markRaw, inject, nextTick } from "vue";
import { Plus, Close } from '@element-plus/icons-vue';
import { $state } from './keys';

const props = defineProps({
  /** The full property values */
  modelValue: { type: Array, required: true },
  definition: { type: Object, required: true }
});

const emit = defineEmits(['update:modelValue', 'add']);

const state = inject($state);
const types = computed(() => props.definition.type ?? ['Text', 'Number', 'Entity']);

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
  if (state.isPrimitive(type)) {
    const [, , defVal] = state.getInlineComponent(type);
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

function addEntity(v) {
  console.log('addEntity');
  const type = data.selectedType;
  data.keyword = '';
  data.selectedType = '';
  emit('add', type, v);
}

function addNewEntity() {
  const type = data.selectedType;
  const name = data.keyword;
  const defaultName = state.entity.name + '-' + props.definition.name;
  const id = name && !state.crate.getEntity('#' + name) ? '#' + name :
    state.crate.uniqueId(`#${name || defaultName}-`);
  console.log(name);
  const e = {
    "@id": id,
    "@type": type,
    name
  };
  data.keyword = '';
  data.selectedType = '';
  emit('add', type, e);
}

function search(query) {
  //console.log(query);
  if (!query) {
    data.options[0].options = [];
    data.options[1].options = [];
    //return;
    return setTimeout(()=>data.keyword = '', 100);
  }
  data.keyword = query;
  const type = data.selectedType;
  // local search
  const qRegex = new RegExp(query, 'i');
  const localOptions = [];
  for (const entity of state.crate.entities({ filter: { '@type': new RegExp(type, 'i') } })) {
    const vals = (entity.name ?? []).concat(entity['@id']);
    if (vals.reduce(((r, v) => r || qRegex.test(v)), false)) {
      localOptions.push(entity);
    }
  }
  //console.log(localOptions);
  data.options[0].options = markRaw(localOptions);
  // remote search
  data.loading = true;
  state.remoteSearch(type, query).then(result => {
    //console.log(result);
    data.options[1].options = markRaw(result);
    data.loading = false;
  });
}

function createLabel(entity) {
  return ([].concat(entity.name))[0] || entity['@id'];
}
</script>

<template>
  <div v-if="!definition.max || !modelValue.length || definition.max > 1">
    <!-- Add buttons -->
    <el-select v-if="types.length > 1" :modelValue="data.selectedType" @clear="data.selectedType = ''" placeholder="..."
      size="small" clearable>
      <template #prefix>
        <el-icon>
          <Plus />
        </el-icon>
      </template>
      <el-option v-for="t of types" :label="t" :value="t" @click="add(t)">
        {{ t }}
      </el-option>
    </el-select>
    <el-button v-else v-for="t of types" size="small" type="primary" :icon="data.selectedType === t ? Close : Plus"
      :class="{ active: data.selectedType === t }" @click="add(t)">
      {{ t }}
    </el-button>
    <!-- search input -->
    <template v-if="data.selectedType">
      <el-select v-focus class="ml-2 mr-2 flex-grow" filterable remote clearable 
        v-model="data.entity" value-key="@id" :loading="data.loading"
        @change="addEntity" :filter-method="v => true" :remote-method="search" size="small">
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
        Create new {{ data.selectedType }}<span v-if="data.keyword">:&nbsp;</span>
        {{ data.keyword }}</el-button>
    </template>
  </div>
</template>

<style>
.el-button.add-new-entity {
  max-width: 30%;
}

.el-button.add-new-entity>span {
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  display: inline;
}
</style>