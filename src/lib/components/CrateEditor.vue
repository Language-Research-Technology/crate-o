<script setup>

import { ref, shallowReactive, reactive, watch, computed, provide, onUpdated, nextTick } from "vue";
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
  /** RO Crate editor profile. */
  profile: { type: Object, default: { classes: {} } },
  /** Identifier of the currently displayed entity. If empty, it will be set to the root dataset when the crate is loaded */
  entityId: { type: String },
  /** Property that needs to be specifically displayed. */
  propertyId: { type: String },
  getFile: { type: Function, default: null }
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
  activeTab: 'all',
  newEntityType: null,
});

const state = shallowReactive(new EditorState({ showEntity }));
provide($state, state);

//var historyStart = window.history.length;

onUpdated(() => {
  console.log('crate updated');
  data.loading = false;
  emit('ready');
});



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
  var id = entityId || data.rootDataset?.['@id'];
  console.log('entityId=', entityId, ' id=', id);
  if (state.crate) {
    if (data.entity?.['@id'] !== id) {
      const entity = state.crate.getEntity(id);
      if (entity) {
        let i = data.history.findIndex(e => e['@id'] === id);
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
    let i = data.history.findIndex(e2 => e['@id'] === e2['@id']);
    if (i > -1) pages = data.history.length - i - 1;
    initEntity(e['@id']);
    emit('update:entityId', e['@id'], pages);
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
      entity[prop] = value;
      emit('update:crate', props.crate); // ,state.crate, diff
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
  <div class="crate-editor" :key="forceKey">
    <el-row v-loading="data.loading" class="crate-o">
      <el-col :span="18" class="p-2" id="currentEntity">
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
          <Entity :model-value="data.entity" @update:model-value="updateEntity" :getFile="getFile"
            :propertyId="propertyId">
          </Entity>

        </template>
        <div v-else="">Entity with id `{{ entityId }}` does not exist in the crate.</div>
      </el-col>

      <el-col :span="6" class="h-screen p-2" id="entityNavigator">
        <el-select-v2 placeholder="Create New Entity" class="flex-grow" filterable clearable :allow-create="false"
          v-model="data.newEntityType" :options="newEntityTypes" @change="onSelectNewEntity"></el-select-v2>

        <el-tabs class="w-full" v-model="data.activeTab">
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