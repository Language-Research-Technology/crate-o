<script setup>
import {reactive, watch, computed} from 'vue';
import {useRouter, useRoute, onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import {profiles} from '@/profiles';
import Welcome from "@/components/Welcome.vue";
import {DataStore} from '../stores/data' ;
import { HomeFilled, ArrowLeftBold } from '@element-plus/icons-vue';
import FilteredPaged from '../components/FilteredPaged.vue';
import LinkEntity from '../components/LinkEntity.vue';
import Entity from '../components/Entity.vue';

//import EntityLinks from "@/components/EntityLinks.vue";

window.DataStore = DataStore;

const $router = useRouter();
const $route = useRoute();

const data = reactive({
  /** @type {?FileSystemDirectoryHandle} */
  dirHandle: null,
  /** @type {?FileSystemFileHandle} */
  metadataHandle: null,
  entity: null,
  entities: [],
  selectedProfile: 1,
  profiles: profiles,
  rootDataset: null,
  history: [],
  loading: false,
  activeTab: 'reverse'
});
DataStore.setProfile(profiles[1]);

const reverseEntities = computed(() => Object.values(data.entity?.['@reverse']||{}).
  reduce((a, e) => a.concat(e), []).filter(e => e !== DataStore.crate.metadataFileEntity));

window.addEventListener("popstate", (event) => {
  // console.log(event.state);
  // console.log('historyStart', historyStart);
  // console.log('history', data.history);
  // if (event.state?.pos) {
  //   data.history.splice(event.state.pos - 1);
  // }
});

var historyStart = window.history.length;
onBeforeRouteUpdate((to, from) => {
  console.log('before update');
  console.log(to, from);
  //const id = decodeURIComponent([].concat(to.query?.id)[0]);
  if (!to.query?.id) return false;
  console.log('state', window.history.state);
  console.log('historyStart', historyStart);
});

watch(() => $route.query.id, (eid, oldId) => {
  console.log('state2', window.history.state);
  if (data.metadataHandle) { //checking crate if it has not been loaded
    const id = decodeURIComponent([].concat(eid)[0]);
    if (id && data.entity) {
      console.log('id=', id);
      if (data.entity['@id'] !== id) data.entity = DataStore.crate.getEntity(id);
      if (window.history.state.position > historyStart + data.history.length) {
        // new page
        data.history.push(data.entity); 
        // if (data.entity === data.rootDataset) {
        //   console.log('root');
        //   //updateRouter(0);
        //   $router.go(historyStart - window.history.state.position);
        // } else {
        //   const i = data.history.findIndex(e => e['@id'] === id);
        //   console.log('i', i);
        //   if (i < 0) {
        //     data.history.push(data.entity); 
        //   } else {
        //     updateRouter(i);
        //   }
        // }
      } else {
        // detect back button or programmatic history jumping
        console.log('splice', window.history.state.position - historyStart)
        data.history.splice(window.history.state.position - historyStart);
      }
    }
  }
}, {immediate: true});

/**
 * Rollback a state in router history. Use updateRouter(0) to reset everything. 
 * @param {number} i - The index in history to jump to .
 */
 function updateRouter(i) {
  const len = data.history.length;
  console.log('updateRouter', i, len);
  if (len && i < len) {
    //data.history.splice(i);
    $router.go(i - len);
  }
}

// onMounted(() => {
//   if (!data.entityId) {
//     $router.push({query: null});
//   }
// })

const commands = {
  async loadProfile() {
    try {
      const [profileHandle] = await window.showOpenFilePicker();
      let file = await profileHandle.getFile();
      const content = await file.text();
      const profile = JSON.parse(content);
      data.selectedProfile = data.profiles.push(profile) - 1;
      DataStore.setProfile(profile);
    } catch (error) {
      console.error(error);
      window.alert(error);
    }
  },

  async open() {
    try {
      data.dirHandle = await window.showDirectoryPicker();
      // reset crate
      data.metadataHandle = null;
      try {
        data.metadataHandle = await data.dirHandle.getFileHandle('ro-crate-metadata.json');
      } catch (error) {
        try {
          data.metadataHandle = await data.dirHandle.getFileHandle('ro-crate-metadata.jsonld');
        } catch (error) {
          //No metadataHandle found start a new Crate
        }
      }
      let rawCrate = {};
      if (data.metadataHandle) {
        let file = await data.metadataHandle.getFile();
        const content = await file.text();
        rawCrate = JSON.parse(content);
      }
      const crate = await DataStore.setCrate(rawCrate);
      data.entity = data.rootDataset = crate.rootDataset;
      data.entities = Array.from(crate.entities());
      data.history = [];
      historyStart = window.history.state.position + 1;
      $router.push({query: {id: encodeURIComponent(DataStore.crate.rootId)}});
    } catch (error) {
      console.error(error);
      window.alert(error);
    }
  },

  async addFiles() {
    const dirHandle = data.dirHandle;
    await processFiles({crate: DataStore.crate, dirHandle, root: ''});
  },

  async save() {
    if (data.dirHandle) {
      // create new crate metadata
      data.metadataHandle = await data.dirHandle.getFileHandle('ro-crate-metadata.json', {create: true});
    } else {
      try {
        data.metadataHandle = await window.showSaveFilePicker({
          suggestedName: 'ro-crate-metadata.json',
          types: [{
            description: 'RO-Crate Metadata File',
            accept: {'application/json': ['.json']}
          }]
        });
      } catch (error) {
      }
    }
    if (data.metadataHandle) {
      const writable = await data.metadataHandle.createWritable();
      const content = JSON.stringify(DataStore.crate, null, 2);
      await writable.write(content);
      await writable.close();
    }
  }
};

const notThisFiles = [
  'ro-crate-metadata.json',
  '.DS_Store',
  '.git',
  'node_modules'
];

async function processFiles({crate, dirHandle, root}) {
  for await (const [key, handle] of dirHandle.entries()) {
    let filePath = root ? root + '/' + key : key;
    if (handle.kind === 'directory' && !notThisFiles.includes(key)) {
      await processFiles({crate, dirHandle: handle, root: filePath});
    } else if (handle.kind === 'file' && !notThisFiles.includes(key)) {
      const file = {
        "@id": filePath,
        "@type": "File"
      }
      crate.addValues(crate.rootDataset, 'hasPart', file);
    }
  }
}

function updateEntity({property, value}) {
  data.entity[property] = value;
}

</script>

<template>
  <div class="p-2 bg-slate-200">
    <el-form :inline="true">
    <el-form-item class="">
      <el-dropdown trigger="click" @command="command => commands[command]?.()">
        <el-button type="primary">File &nbsp;<i class="fa-solid fa-caret-down"></i></el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="open">
              <el-tooltip effect="dark" placement="right"
                          content="Open a directory to describe or select an empty directory">
                Open Directory
              </el-tooltip>
            </el-dropdown-item>
            <el-dropdown-item command="addFiles" :disabled="data.dirHandle?.name === undefined">
              <el-tooltip effect="dark" placement="right"
                          content="Load Files (With Selected Directory)">
                Load Files
              </el-tooltip>
            </el-dropdown-item>
            <el-dropdown-item command="save" :disabled="data.dirHandle?.name === undefined">
              <el-tooltip effect="dark" placement="right"
                          content="Save crate metadata to the currently opened directory">
                Save Progress
              </el-tooltip>
            </el-dropdown-item>
            <el-dropdown-item command="loadProfile">
              <el-tooltip effect="dark" placement="right"
                          content="Load a new profile from your computer">
                Load profile
              </el-tooltip>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </el-form-item>
    
    <el-form-item label="Profile:" class="w-9/12">
      <el-select v-model="data.selectedProfile" class="w-full" placeholder="Select a profile" 
        @change="i => DataStore.setProfile(data.profiles[i])">
        <el-option v-for="(profile, index) of data.profiles" :label="profile.metadata.name" :value="index">
          <div class="border-b-1 mb-2">
            <p>{{ profile.metadata.name }}</p>
            <p class="text-slate-500 text-xs">{{ profile.metadata.description }}</p>
          </div>
        </el-option>
      </el-select>
    </el-form-item>
    <div v-if="data.dirHandle" class="text-large">Selected Directory: 
      <span class="font-bold">{{ data.dirHandle.name }}</span></div>
  </el-form>
  </div>
  <el-row class="bg-slate-300 p-2" v-if="data.rootDataset">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item>
        <el-link :icon="HomeFilled" :href="`#/?id=${encodeURIComponent(data.rootDataset['@id'])}`" 
          @click.stop.prevent="updateRouter(0)">
        {{ data.rootDataset.name[0] || 'Root Dataset' }}
        </el-link>
      </el-breadcrumb-item>
      <el-breadcrumb-item v-for="e,i in data.history">
        <!-- <router-link to="/">Go to Home</router-link> -->
        <el-link :href="`#/?id=${encodeURIComponent(e['@id'])}`"
          @click.stop.prevent="updateRouter(i+1)">
          {{e.name?.[0]||e['@id']}}
        </el-link>
      </el-breadcrumb-item>
    </el-breadcrumb>  
  </el-row>

  <el-row class="crate-o" v-if="data.dirHandle">
    <el-col :span="18" class="p-2">
      <Entity v-if="data.entity" v-model="data.entity"></Entity>
    </el-col>

    <el-col :span="6" class="h-screen p-2">
      <el-tabs class="w-full" v-model="data.activeTab">
        <el-tab-pane label="Reverse Links" name="reverse">
          <FilteredPaged v-if="data.entity?.['@reverse']" :modelValue="reverseEntities"
            v-slot="{ value, index }">
            <LinkEntity :modelValue="value" :icon="ArrowLeftBold"></LinkEntity>
          </FilteredPaged>
        </el-tab-pane>
        <el-tab-pane label="All Entities" name="all" lazy>
          <FilteredPaged :modelValue="data.entities"
            v-slot="{ value, index }">
            <LinkEntity :modelValue="value"></LinkEntity>
          </FilteredPaged>
        </el-tab-pane>
      </el-tabs>
      
    </el-col>
  </el-row>
  <div v-else>
    <welcome/>
  </div>

</template>

<style>
.el-select-dropdown__item {
  height: auto;
}
</style>
