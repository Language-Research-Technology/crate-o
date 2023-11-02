<script setup>

import {ref, shallowReactive, reactive, watch, computed, provide, onUpdated, nextTick, toRaw} from "vue";
import {$state} from './keys';
import {EditorState} from './EditorState';
import {HomeFilled, ArrowLeftBold, Delete} from '@element-plus/icons-vue';
import FilteredPaged from '../components/FilteredPaged.vue';
import LinkEntity from '../components/LinkEntity.vue';
import Entity from '../components/Entity.vue';
import {useRouter, useRoute, onBeforeRouteUpdate} from 'vue-router';
import {isEmpty} from "lodash";

const props = defineProps({
  //  modelValue: { type: ROCrate },
  /** RO Crate data in form of plain JSON object. */
  crate: {type: Object, default: {}},
  /** RO Crate editor profile. */
  profile: {type: Object, default: {}},
  /** Identifier of the currently displayed entity. Default to the root dataset */
  entityId: {type: String},
  dirHandle: {type: Object, default: {}},
});

const emit = defineEmits({
  /** Triggered when displaying different entity */
  'update:entityId': null,
  /** Triggered when adding a value */
  add: null,
  /** Triggered when removing a value */
  remove: null,
  /** Triggered when changing a value */
  change: null,
  /** Triggered when data is rendered */
  ready: null
});

const $router = useRouter();
const $route = useRoute();

const data = reactive({
  entity: null,
  //entities: [],
  rootDataset: null,
  loading: false,
  history: [],
  activeTab: 'reverse',
  newEntityType: null,
  newEntityTypes: []
});

const state = shallowReactive(new EditorState());
window.editorState = state;
provide($state, state);

var historyStart = window.history.length;

onUpdated(() => {
  console.log('crate updated');
  data.loading = false;
  emit("ready");
});

onBeforeRouteUpdate((to, from) => {
  // console.log('before update, entity id= ', data.entity?.['@id']);
  // console.log('to:', to);
  // console.log('from:', from);
  // console.log('state', window.history.state);
  // console.log('historyStart', historyStart);
  // The window.history.state in this handler is still of the `from` path instead of `to` path
  // except when the history traverse back (eg back button is pressed), it is of the `to` path 
  if (!data.rootDataset) return;
  const id = decodeURIComponent([].concat(to.query?.id)[0]);
  // check if the requested id is already in the breadcrumb stack
  // if it is, move browser history back to the same id
  //console.log('query id:', id);
  if (!to.query?.id) return false;
  if (window.history.state.current === to.fullPath) {
    // when traverse back in history, remove the stack 
    const i = data.history.findIndex(e => e['@id'] === id);
    // console.log('splice', i+1);
    if (i >= 0 || id === data.rootDataset['@id']) {
      data.history.splice(i + 1);
      return;
    }
  }
  var pages = 0;
  if (id === data.rootDataset['@id']) {
    pages = data.history.length;
  } else {
    var i = data.history.findIndex(e => e['@id'] === id);
    if (i > -1) pages = data.history.length - i - 1;
  }
  if (pages) {
    // console.log('pages', pages);
    $router.go(-pages);
    return false;
  }
});

watch(() => $route.query.id, (eid, oldId) => {
  //console.log('state2', window.history.state);
  const id = decodeURIComponent([].concat(eid)[0]);
  if (id && state.crate) {
    //console.log('id=', id);
    if (data.entity?.['@id'] !== id) data.entity = state.crate.getEntity(id);
    // console.log('pos',window.history.state.position);
    // console.log('historyStart', historyStart);
    // console.log('data.history.length', data.history.length);
    //if (window.history.state.position > historyStart + data.history.length) {
    if (!data.history.length || id !== data.history[data.history.length - 1]['@id']) {
      if (data.entity && data.entity['@id'] !== data.rootDataset?.['@id']) {
        // new page
        data.history.push(data.entity);
      }
    }
  }
}, {immediate: true});

watch(() => props.crate, async crate => {
  console.log('watch crate');
  data.loading = true;
  await state.setCrate(crate);
  data.entity = data.rootDataset = state.crate.rootDataset;
  data.history = [];
  historyStart = window.history.state?.position + 1;
  $router.push({query: {id: encodeURIComponent(state.crate.rootId)}});
  state.dirHandle = toRaw(props.dirHandle);
  console.log(data.entity['@id']);
}, {immediate: true});

watch(() => props.profile, (profile) => {
  console.log('watch profile', profile);
  state.setProfile(profile);
  newEntityUpdate();
}, {immediate: true});

const unlinkedEntities = computed(() => state.entities.filter(e => {
  //TODO: make this into an utility function because we are doing this in many parts
  const linksCount = Object.values(e['@reverse']).reduce((count, refs) => count + refs.length, 0);
  return linksCount <= 0;
}));
//const reverseEntities = computed(() => Object.values(data.entity?.['@reverse'] || {}).reduce((a, e) => a.concat(e), []).filter(e => e !== state.crate.metadataFileEntity));

const forceKey = ref(0);
defineExpose({
  get rootDataset() {
    return data.rootDataset;
  },
  get crate() {
    return state.crate.toJSON();
  },
  updateCrate(cb) {
    cb(state.crate);
    forceKey.value++;
  }
});

function showEntity(e) {
  $router.push({query: {id: encodeURIComponent(e['@id'])}});
}

// const value = computed(() => data.newEntityType);
// const values = computed(() => {
//   return data.newEntityTypes;
// });

function newEntityUpdate() {
  const entities = [];
  console.log("Profile", state.profile);
  for (let key of Object.keys(state.profile.classes)) {
    entities.push({value: key, label: key});
  }
  data.newEntityTypes = entities
}

function onSelectNewEntity(type) {
  let cleanName = type.replace(/\W/g, "_");
  let id = state.crate.uniqueId(`#${cleanName}-`);
  const item = {
    "@id": id,
    "@type": [type],
    "name": [cleanName]
  };
  state.crate.addEntity(item, {replace: true, recurse: true});
  const newEntity = state.crate.getEntity(item['@id'])
  state.ensureContext(type);
  state.entities.push(newEntity);
  showEntity(item);
}

function deleteEntity() {
  //delete
  //count the links
  const linksCount = Object.values(data.entity['@reverse']).reduce((count, refs) => count + refs.length, 0);
  const entityMessage = linksCount > 1 ? 'entities' : 'entity';
  if (linksCount === 0 || window.confirm(`This entity is referenced by ${linksCount} other ${entityMessage}. Are you sure you want to delete it?`)) {
    const currentEntity = data.entity;

    const i = state.entities.findIndex(e => e['@id'] === currentEntity['@id']);
    if (i >= 0) state.entities.splice(i, 1);
    nextTick(() => {
      data.history.pop();
      data.entity = null;
      state.crate.deleteEntity(currentEntity, {references: true});
      const someEntity = data.history[data.history.length - 1] ?? data.rootDataset;
      $router.push({query: {id: encodeURIComponent(someEntity['@id'])}});
    })
  }

}
</script>


<template>
  <div :key="forceKey">
    <el-row class="bg-slate-300 p-2" v-if="data.rootDataset">
      <el-col :span="17" class="p-2 flex items-center">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item>
            <el-link :disabled="!data.history.length" :icon="HomeFilled"
                     :href="`#/?id=${encodeURIComponent(data.rootDataset['@id'])}`">
              {{ data.rootDataset.name?.[0] || 'Root Dataset' }}
            </el-link>
          </el-breadcrumb-item>
          <el-breadcrumb-item v-for="e, i in data.history">
            <!-- <router-link to="/">Go to Home</router-link> -->
            <el-link :disabled="i === data.history.length - 1" :href="`#/?id=${encodeURIComponent(e['@id'])}`">
              {{ e.name?.[0] || e['@id'] }}
            </el-link>
          </el-breadcrumb-item>
        </el-breadcrumb>
      </el-col>
      <el-col :span="5" class="pt-1 pr-3">
        <el-select-v2 placeholder="Create New Entity" class="flex-grow" filterable :allow-create="false"
                      :model-value="data.newEntityType" :options="data.newEntityTypes"
                      @change="onSelectNewEntity"></el-select-v2>

      </el-col>
    </el-row>

    <el-row v-loading="data.loading" class="crate-o">
      <el-col :span="18" class="p-2">
        <el-page-header :icon="null" v-if="data.entity"
                        class="bg-blue-100 border-t border-b border-blue-500 text-blue-700 px-4 py-3" role="alert">
          <template #title>
            <span class="text-large font-600 mr-3"> {{ data.entity['name']?.[0] || data.entity['@id'] }} </span>
          </template>
          <template #content>
          </template>
          <template #extra>
            <div class="flex items-center">
              <el-tooltip
                  v-if="data.entity && data.rootDataset !== data.entity"
                  :content="'Delete entity '+ data.entity['name']?.[0] || data.entity['@id']"
                  placement="bottom-start"
                  effect="light">
                <el-button @click="deleteEntity" type="danger" plain
                           :icon="Delete">Remove
                </el-button>
              </el-tooltip>
            </div>
          </template>
        </el-page-header>
        <Entity v-if="data.entity" v-model="data.entity" @entityCreated="showEntity"></Entity>
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
            <FilteredPaged :modelValue="state.entities" v-slot="{ value, index }">
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