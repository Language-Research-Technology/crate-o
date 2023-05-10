<script setup>
import { reactive, computed, markRaw } from "vue";
import { Plus, Close } from '@element-plus/icons-vue';
import { isPrimitive, DataStore, remoteSearch } from "../stores/data";

const props = defineProps({
  /** The full property values */
  modelValue: { type: Array, required: true },
  definition: { type: Object, required: true }
});

const emit = defineEmits(['update:modelValue', 'add', 'addEntity']);

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

const vFocus = (el, binding, vnode) => el.getElementsByTagName('input')[0].focus();

//var options = [{ value: 1, label: 'a' }, { value: 2, label: 'b' }];

function onClick(type) {
  console.log(type);
  if (isPrimitive(type)) {
    emit('add', type);
    return;
  }
  if (data.selectedType == type) {
    data.selectedType = '';
  } else {
    data.selectedType = type;
  }
}

function addEntity(v) {
  data.keyword = '';
  data.selectedType = '';
  emit('addEntity', v);
}

function addNewEntity() {
  const type = data.selectedType;
  const name = data.keyword;
  const id = name && !DataStore.crate.getEntity('#' + name) ? '#' + name :
    DataStore.crate.uniqueId(`#${name || type}-`);
  const e = {
    "@id": id,
    "@type": type,
    name
  };
  data.keyword = '';
  data.selectedType = '';
  emit('addEntity', e);
}

function search(query) {
  console.log(query);
  if (!query) {
    data.options[0].options = [];
    data.options[1].options = [];
    return;
  }
  data.keyword = query;
  const type = data.selectedType;
  // local search
  const qRegex = new RegExp(query, 'i');
  const localOptions = [];
  for (const entity of DataStore.crate.entities({ filter: { '@type': new RegExp(type, 'i') } })) {
    const vals = (entity.name ?? []).concat(entity['@id']);
    if (vals.reduce(((r, v) => r || qRegex.test(v)), false)) {
      localOptions.push(entity);
    }
  }
  console.log(localOptions);
  data.options[0].options = markRaw(localOptions);
  // remote search
  data.loading = true;
  remoteSearch(type, query).then(result => {
    console.log(result);
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
      <el-option v-for="t of types" :label="t" :value="t" @click="onClick(t)">
        {{ t }}
      </el-option>
    </el-select>
    <el-button v-else v-for="t of types" size="small" type="primary" 
      :icon="data.selectedType === t ? Close : Plus"
      :class="{ active: data.selectedType === t }" @click="onClick(t)">
      {{ t }}
    </el-button>
    <!-- search input -->
    <template v-if="data.selectedType">
      <el-select v-focus class="ml-2 mr-2 flex-grow" filterable remote clearable 
        v-model="data.entity" value-key="@id" :loading="data.loading"
        @change="addEntity" :filter-method="v => { }" :remote-method="search" size="small">
        <template v-for="group in data.options" :key="group.value">
          <el-option-group v-if="group.options.length" :label="group.label">
            <el-option v-for="item in group.options" :key="item['@id']" 
              :label="createLabel(item)" :value="item">
              <!-- <span class="italic">[{{ data.selectedType }}]&nbsp;</span> -->
              <span class="font-bold">{{ createLabel(item) }}</span>
            </el-option>
          </el-option-group>
        </template>
      </el-select>
      <el-button size="small" type="success" @click="addNewEntity">
        Create new {{ data.selectedType }}<span v-if="data.keyword">:&nbsp;</span>
        {{ data.keyword }}</el-button>
    </template>
  </div>
</template>