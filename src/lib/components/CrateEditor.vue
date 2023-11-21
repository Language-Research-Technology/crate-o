<script setup>

import { ref, shallowReactive, reactive, watch, watchEffect, computed, provide, onUpdated, nextTick, toRaw } from "vue";
import { $state } from './keys';
import { EditorState } from './EditorState';
import { HomeFilled, ArrowLeftBold, Delete } from '@element-plus/icons-vue';
import FilteredPaged from './FilteredPaged.vue';
import LinkEntity from './LinkEntity.vue';
import Entity from './Entity.vue';
import { countReverse } from './utils.js'

const props = defineProps({
  //  modelValue: { type: ROCrate },
  /** RO Crate data in form of plain JSON object. */
  crate: { type: Object, default: {} },
  /** RO Crate editor profile. */
  profile: { type: Object, default: {} },
  /** Identifier of the currently displayed entity. If empty, it will be set to the root dataset when the crate is loaded */
  entityId: { type: String },
  /** Property that needs to be specifically displayed. */
  propertyId: { type: String },
  getFile: { type: Function, default: null }
});

const emit = defineEmits({
  /** Triggered when navigating internally to display a different entity */
  'update:entityId': null,
  /** Triggered when adding a value */
  add: null,
  /** Triggered when removing a value */
  remove: null,
  /** Triggered when changing a value */
  change: null,
  /** Triggered when the internal data of ROCrate instance is created */
  data: null,
  /** Triggered when data is rendered */
  ready: null
});


const data = reactive({
  entity: null,
  //entities: [],
  rootDataset: null,
  loading: false,
  history: [],
  activeTab: 'reverse',
  newEntityType: null,
});

const state = shallowReactive(new EditorState());
state.showEntity = showEntity;
//window.editorState = state;
provide($state, state);

var historyStart = window.history.length;

onUpdated(() => {
  console.log('crate updated');
  data.loading = false;
  emit('ready');
});



watch(() => props.crate, async crate => {
  console.log('watch crate');
  data.loading = true;
  data.history = [];
  historyStart = window.history.state?.position + 1;
  //$router.push({query: {id: encodeURIComponent(state.crate.rootId)}});
  const roc = await state.setCrate(crate);
  //data.entity = data.rootDataset = state.crate.rootDataset;
  data.rootDataset = roc.rootDataset;
  //state.dirHandle = toRaw(props.dirHandle);
  initEntity(props.entityId);
  emit('data', roc);
}, { immediate: true });

watch(() => props.profile, (profile) => {
  //console.log('watch profile', profile);
  state.setProfile(profile);
  //newEntityUpdate();
}, { immediate: true });

watch(() => props.entityId, entityId => {
  console.log('watch entityId');
  initEntity(props.entityId);
});

function initEntity(entityId) {
  if (state.crate) {
    data.entity = state.crate.getEntity(entityId);
    if (data.entity) {
      let id = data.entity['@id'];
      let i = data.history.findIndex(e => e['@id'] === id);
      if (i > -1) data.history.splice(i + 1);
      else data.history.push(data.entity);
    } else if (data.rootDataset) {
      showEntity(data.rootDataset);
    }
  }
}

const unlinkedEntities = computed(() => Array.from(state.entities.value).filter(e => !countReverse(e)));
//const reverseEntities = computed(() => Object.values(data.entity?.['@reverse'] || {}).reduce((a, e) => a.concat(e), []).filter(e => e !== state.crate.metadataFileEntity));

const forceKey = ref(0);
defineExpose({
  get rootDatasetId() {
    return data.rootDataset['@id'];
  },
  get crate() {
    return state.crate.toJSON();
  },
  setProperty(entity, propName, values) {
    state.crate.setProperty(entity, propName, values);
    state.refreshEntities();
    forceKey.value++;
  },
  /** Manually update the editor's internal representation of the ro-crate data */
  updateCrate(cb) {
    cb(state.crate);
    state.refreshEntities();
    forceKey.value++;
  }
});

function showEntity(e) {
  if (data.entity !== e) {
    let pages; // the number of pages to go back to
    let i = data.history.findIndex(e2 => e['@id'] === e2['@id']);
    if (i > -1) pages = data.history.length - i - 1;
    emit('update:entityId', e['@id'], pages);
  }
  // $router.push({ query: { id: encodeURIComponent(e['@id']) } });
}

// const value = computed(() => data.newEntityType);
const newEntityTypes = computed(() => {
  const classes = state.profile.enabledClasses || Object.keys(state.profile.classes) || [];
  return classes.map(k => ({ value: k, label: k }));
});

function onSelectNewEntity(type) {
  if (type) {
    let cleanName = type.replace(/\W/g, "_");
    let id = state.crate.uniqueId(`#${cleanName}-`);
    const item = {
      "@id": id,
      "@type": type,
      "name": cleanName
    };
    state.crate.addEntity(item, { replace: true, recurse: true });
    const newEntity = state.crate.getEntity(item['@id'])
    state.ensureContext(type);
    state.entities.value.add(newEntity);
    showEntity(item);
    data.newEntityType = null;
  }
}

function deleteEntity() {
  //delete
  //count the links
  const linksCount = countReverse(data.entity);
  const entityMessage = linksCount > 1 ? 'entities' : 'entity';
  if (linksCount === 0 || window.confirm(`This entity is referenced by ${linksCount} other ${entityMessage}. Are you sure you want to delete it?`)) {
    // const i = state.entities.findIndex(e => e['@id'] === data.entity['@id']);
    // if (i >= 0) state.entities.splice(i, 1);
    state.entities.value.delete(data.entity['@id']);
    nextTick(() => {
      data.history.pop();
      state.crate.deleteEntity(data.entity, { references: true });
      const prevEntity = data.history[data.history.length - 1] ?? data.rootDataset;
      emit("update:entityId", prevEntity['@id']);
    })
  }

}

function truncate(text) {
  return text.length > 50 ? text.replace(/(.{20}).+(.{20})/, "$1&hellip;$2") : text;
}

</script>


<template>
  <div :key="forceKey">
    <el-row class="bg-slate-300 p-2" v-if="data.rootDataset">
      <el-col :span="17" class="p-2 flex items-center">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item v-for="e, i in data.history">
            <!-- <router-link to="/">Go to Home</router-link> -->
            <el-link :disabled="i === data.history.length - 1" :icon="i ? null : HomeFilled" href="/"
              @click.prevent="showEntity(e)" :title="e.name?.[0] || e['@id']">
              <span v-html="truncate(e.name?.[0] || (i ? e['@id'] : 'Root Dataset'))"></span>
            </el-link>
          </el-breadcrumb-item>
        </el-breadcrumb>
      </el-col>
      <el-col :span="5" class="pt-1 pr-3">
        <el-select-v2 placeholder="Create New Entity" class="flex-grow" filterable clearable :allow-create="false"
          v-model="data.newEntityType" :options="newEntityTypes" @change="onSelectNewEntity"></el-select-v2>

      </el-col>
    </el-row>

    <el-row v-loading="data.loading" class="crate-o">
      <el-col :span="18" class="p-2">
        <template v-if="data.entity">
          <el-page-header :icon="null" class="bg-blue-100 border-t border-b border-blue-500 text-blue-700 px-4 py-3"
            role="alert">
            <template #title>
              <span class="text-large font-600 mr-3"> {{ data.entity['name']?.[0] || data.entity['@id'] }} </span>
            </template>
            <template #content>
            </template>
            <template #extra>
              <div class="flex items-center">
                <el-tooltip v-if="data.rootDataset !== data.entity"
                  :content="'Delete entity ' + data.entity['name']?.[0] || data.entity['@id']" placement="bottom-start"
                  effect="light">
                  <el-button @click="deleteEntity" type="danger" plain :icon="Delete">Remove</el-button>
                </el-tooltip>
              </div>
            </template>
          </el-page-header>

          <Entity :model-value="data.entity" @update:model-value="showEntity" :getFile="getFile" :propertyId="propertyId">
          </Entity>

        </template>
      </el-col>

      <el-col :span="6" class="h-screen p-2">
        <el-tabs class="w-full" v-model="data.activeTab">
          <el-tab-pane label="Links from" name="reverse">
            <section v-for="[prop, entities] in Object.entries(data.entity?.['@reverse'] || {})">
              <template v-if="data.entity !== data.rootDataset || prop !== 'about'">
                <h1>{{ prop }}:</h1>
                <FilteredPaged :modelValue="entities" v-slot="{ value, index }">
                  <LinkEntity :modelValue="value" :icon="ArrowLeftBold"></LinkEntity>
                </FilteredPaged>
              </template>
            </section>
          </el-tab-pane>
          <el-tab-pane label="All Entities" name="all" lazy>
            <FilteredPaged :modelValue="Array.from(state.entities.value)" v-slot="{ value, index }">
              <LinkEntity :modelValue="value"></LinkEntity>
            </FilteredPaged>
          </el-tab-pane>
          <el-tab-pane label="Unlinked Entities" name="unlinked" lazy>
            <FilteredPaged :modelValue="unlinkedEntities" v-slot="{ value, index }">
              <LinkEntity :modelValue="value"></LinkEntity>
            </FilteredPaged>
          </el-tab-pane>
        </el-tabs>
      </el-col>
    </el-row>
  </div>
</template>