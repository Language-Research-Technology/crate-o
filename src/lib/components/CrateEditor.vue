<script setup>

import { ref, shallowReactive, reactive, watch, computed, provide } from "vue";
import { HomeFilled, ArrowLeftBold, Delete } from '@element-plus/icons-vue';
import {
  ElRow, ElCol, ElBreadcrumb, ElBreadcrumbItem, ElTabs, ElTabPane,
  ElPageHeader, ElTooltip, ElLink, ElSelectV2, ElButton, ElLoading, ElTag, ElIcon
} from 'element-plus';
import { $state } from './keys';
import { EditorState } from './EditorState';
import FilteredPaged from './FilteredPaged.vue';
import LinkEntity from './LinkEntity.vue';
import Entity from './Entity.vue';
import { countReverse } from './utils.js'

const vLoading = ElLoading.directive;
const props = defineProps({
  //  modelValue: { type: ROCrate },
  /** RO Crate data in form of plain JSON object. */
  crate: { type: Object, default: {} },
  /** RO Crate editor mode. */
  mode: { type: Object, default: { classes: {} } },
  /** Identifier of the currently displayed entity. If empty, it will be set to the root dataset when the crate is loaded */
  entityId: { type: String },
  /** Property that needs to be specifically displayed. */
  propertyId: { type: String },
  loadFile: { type: Function, default: null }
});

const emit = defineEmits({
  /** Triggered when crate data is changed */
  'update:crate': null,
  /** Triggered when navigating internally to display a different entity */
  'update:entityId': null,
  /** Triggered when adding a value */
  add: null,
  /** Triggered when removing a value */
  remove: null,
  /** Triggered when changing a value */
  change: null,
  /** Triggered when data is ready to be displayed */
  ready: null
});


const data = reactive({
  entity: null,
  //entities: [],
  rootDataset: null,
  loading: false,
  history: [],
  activeTab: 'all',
  newEntityType: null,
  refreshUnlinked: 0
});

const state = shallowReactive(new EditorState({ showEntity }));
provide($state, state);


watch(() => props.crate, async crate => {
  console.log('watch crate', props.crate);
  data.loading = true;
  data.history = [];
  data.entity = null;
  //historyStart = window.history.state?.position + 1;
  //$router.push({query: {id: encodeURIComponent(state.crate.rootId)}});
  const roc = await state.setCrate(crate);
  //data.entity = data.rootDataset = state.crate.rootDataset;
  data.rootDataset = roc.rootDataset;
  //state.dirHandle = toRaw(props.dirHandle);
  initEntity(props.entityId);
  data.loading = false;
  emit('ready', roc, refresh);
}, { immediate: true });

watch(() => props.mode, (profile) => {
  //console.log('watch profile', profile);
  state.setProfile(profile);
  //newEntityUpdate();
}, { immediate: true });

watch(() => props.entityId, entityId => {
  console.log('watch entityId');
  initEntity(props.entityId);
});

function initEntity(entityId) {
  const id = entityId || data.rootDataset?.['@id'];
  console.log('entityId=', entityId, ' id=', id);
  if (state.crate) {
    if (data.entity?.['@id'] !== id) {
      const entity = state.crate.getEntity(id);
      if (entity) {
        const i = data.history.findIndex(e => e['@id'] === id);
        if (i > -1) data.history.splice(i + 1);
        else data.history.push(entity);
        data.entity = entity;
        //console.log(data.history);
        //console.log('initEntity');
        if (entityId !== id) emit('update:entityId', id);
      }
    }
  }
}

function showEntity(e) {
  if (data.entity !== e) {
    let pages; // the number of pages to go back to
    const i = data.history.findIndex(e2 => e['@id'] === e2['@id']);
    if (i > -1) pages = data.history.length - i - 1;
    initEntity(e['@id']);
    emit('update:entityId', e['@id'], pages);
  }
}

const entities = computed(() => {
  return Array.from(state.entities.value);
});

const unlinkedEntities = computed(() => {
  data.refreshUnlinked;
  // find unlinked entities from the root
  // use id here because each entity is vue proxy object
  const unvisited = new Map(entities.value.filter(e => !e['@type'].some(t => t.match(/^rdfs?:/))).map((e) => [e['@id'], e]));
  //const unvisited = new Map(entities.value.map((e) => [e['@id'], e]));
  // do DFS traversal
  const crate = state.crate;
  const stack = [crate.rootId];
  while (stack.length > 0) {
    const eid = stack.pop();
    const e = unvisited.get(eid);
    if (e) {
      unvisited.delete(eid);
      function handleValues(values) {
        for (const val of values) {
          const id = val['@id'];
          if (id && unvisited.has(id)) {
            stack.push(id);
          }
        }
      }
      for (const propName of ['isPartOf', 'pcdm:memberOf', 'memberOf']) {
        handleValues(e['@reverse'][propName]);
      }
      for (const propName in e) {
        if (!propName.startsWith('@')) {
          handleValues(e[propName]);
        }
      }
    }
  }
  //return entities.value.filter(e => unvisited.has(e['@id']));
  return Array.from(unvisited.values());
});
//const reverseEntities = computed(() => Object.values(data.entity?.['@reverse'] || {}).reduce((a, e) => a.concat(e), []).filter(e => e !== state.crate.metadataFileEntity));

const forceKey = ref(0);
/** Refresh the UI after making internal changes directly */
function refresh() {
  state.refreshEntities();
  forceKey.value++;
}
/** Manually update the editor's internal representation of the ro-crate data */
function setProperty(entity, propName, values) {
  state.crate.setProperty(entity, propName, values);
  refresh();
}

defineExpose({
  get rootDatasetId() {
    return data.rootId;
  },
  get rootId() {
    return data.rootId;
  },
  get crate() {
    return state.crate.toJSON();
  },
  setProperty,
  refresh
});

// const value = computed(() => data.newEntityType);
const newEntityTypes = computed(() => {
  const classes = state.profile.enabledClasses || Object.keys(state.profile.classes);
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
    emit('update:crate', props.crate);
  }
}

function updateEntity(entity, prop, value) {
  if (data.entity === entity) {
    if (data.entity[prop] !== value) {
      data.entity[prop] = value;
      console.log('updateEntity', prop, value, data.entity[prop]);
      emit('update:crate', props.crate); // ,state.crate, diff
      if ([].concat(value).some(v => v['@id'])) data.refreshUnlinked++;
    }
    if (prop === '@id' && value !== props.entityId) {
      emit('update:entityId', value);
    }
  } else {
    data.entity = entity;
    emit('update:crate', props.crate); // ,state.crate, diff
  }
}

async function deleteEntity() {
  //delete
  //count the links
  const linksCount = countReverse(data.entity);
  const entityMessage = linksCount > 1 ? 'entities' : 'entity';
  if (linksCount === 0 || window.confirm(`This entity is referenced by ${linksCount} other ${entityMessage}. Are you sure you want to delete it?`)) {
    // const i = state.entities.findIndex(e => e['@id'] === data.entity['@id']);
    // if (i >= 0) state.entities.splice(i, 1);
    const e = data.entity;
    data.history.pop();
    data.entity = data.history[data.history.length - 1] ?? data.rootDataset;
    await state.deleteEntity(e);
    emit("update:entityId", data.entity);
    emit("update:crate", props.crate);
  }

}

function truncate(text) {
  return text.length > 50 ? text.replace(/(.{20}).+(.{20})/, "$1&hellip;$2") : text;
}

</script>


<template>
  <div class="crate-editor" :key="forceKey" v-loading="data.loading">
    <el-row class="crate-o" v-show="!data.loading">
      <el-col :span="18" class="p-2 pr-3" id="currentEntity">
        <div class="current-entity-heading py-3 px-2 mb-3 items-center bg-slate-200" v-if="data.rootDataset">
          <el-breadcrumb class="mb-3" separator=">">
            <template v-for="e, i in data.history">
              <el-breadcrumb-item>
                <el-link :icon="i ? null : HomeFilled" href="/" @click.prevent="showEntity(e)"
                  :title="e.name?.[0] || e['@id']">
                  <span v-html="truncate(e.name?.[0] || (i ? e['@id'] : 'Root Dataset'))"></span>
                </el-link>
              </el-breadcrumb-item>
            </template>
          </el-breadcrumb>
          <el-row v-if="data.entity">
            <el-col :sm="24" :md="18" :lg="20">
              <h2 class="text-2xl mr-3">
                <span class="text-2xl font-bold text-slate-500">Current Entity: </span>
                <el-icon style="font-size: 30px; top:4px;" v-if="data.rootDataset === data.entity">
                  <HomeFilled />
                </el-icon>
                {{ data.entity['name']?.[0] || data.entity['@id'] }}
              </h2>
            </el-col>
            <el-col :sm="24" :md="6" :lg="4">
              <el-tooltip v-if="data.rootDataset !== data.entity"
                :content="'Delete entity ' + data.entity['name']?.[0] || data.entity['@id']" placement="bottom-start"
                effect="light">
                <el-button class="float-right" @click="deleteEntity" type="danger" plain :icon="Delete">Remove
                  Entity</el-button>
              </el-tooltip>
            </el-col>
          </el-row>
        </div>
        <template v-if="data.entity">
          <Entity :model-value="data.entity" @update:model-value="updateEntity" :getFile="loadFile"
            :propertyId="propertyId">
          </Entity>

        </template>
        <div v-else="">Entity with id `{{ entityId }}` does not exist in the crate.</div>
      </el-col>

      <el-col :span="6" class="h-screen p-2" id="entityNavigator">
        <el-select-v2 placeholder="Create New Entity" class="flex-grow" filterable clearable :allow-create="false"
          v-model="data.newEntityType" :options="newEntityTypes" @change="onSelectNewEntity"></el-select-v2>

        <el-tabs class="w-full" v-model="data.activeTab">
          <el-tab-pane name="all" lazy>
            <template #label>
              <span title="All metadata entities associated with your collection.">All Entities</span>
            </template>
            <FilteredPaged :modelValue="entities" v-slot="{ value, index }">
              <LinkEntity :modelValue="value"></LinkEntity>
            </FilteredPaged>
          </el-tab-pane>
          <el-tab-pane name="unlinked" lazy>
            <template #label>
              <span title="Metadata entities that are not currently referenced by properties on the Root dataset or other entities">Unlinked Entities</span>
            </template>
            <FilteredPaged :modelValue="unlinkedEntities" v-slot="{ value, index }">
              <LinkEntity :modelValue="value"></LinkEntity>
            </FilteredPaged>
          </el-tab-pane>
        </el-tabs>
      </el-col>
    </el-row>
  </div>
</template>

<style>
.el-input.is-error .el-input__wrapper {
  box-shadow: 0 0 0 1px var(--el-color-danger) inset;
}

.el-input.is-error .el-input__wrapper {
  box-shadow: 0 0 0 1px var(--el-color-danger) inset;
}

.el-form-item.is-changed .el-input__wrapper,
el-form-item.is-changed .el-checkbox.is_bordered {
  box-shadow: 0 0 0 1px var(--el-color-success) inset;
}

label.el-form-item__label,
div.el-form-item__label {
  align-items: center;
}

.el-breadcrumb .el-link {
  color: #626aef;
  font-weight: 600;
  font-size: 90%;
}
</style>