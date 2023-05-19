<script setup>
import { reactive, ref, computed } from 'vue';
import { profiles } from '@/profiles';
import Welcome from "@/components/Welcome.vue";
//import {DataStore} from '../stores/data' ;
import { HomeFilled, ArrowLeftBold, ArrowDown } from '@element-plus/icons-vue';

//import EntityLinks from "@/components/EntityLinks.vue";

const data = reactive({
  /** @type {?FileSystemDirectoryHandle} */
  dirHandle: null,
  /** @type {?FileSystemFileHandle} */
  metadataHandle: null,
  crate: null,
  entityId: '',
  selectedProfile: 1,
  profiles: profiles,
  loading: false,
});
window.data = data;
const profile = computed(() => data.profiles[data.selectedProfile]);

const editor = ref();

const commands = {
  async loadProfile() {
    try {
      const [profileHandle] = await window.showOpenFilePicker();
      let file = await profileHandle.getFile();
      const content = await file.text();
      const profile = JSON.parse(content);
      data.selectedProfile = data.profiles.push(profile) - 1;
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
      if (data.metadataHandle) {
        data.loading = true;
        let file = await data.metadataHandle.getFile();
        const content = await file.text();
        data.crate = JSON.parse(content);
      }
      //data.loading = false;
    } catch (error) {
      console.error(error);
      window.alert(error);
    }
  },

  async addFiles() {
    const dirHandle = data.dirHandle;
    await processFiles({ dirHandle, root: '' });
  },

  async save() {
    if (data.dirHandle) {
      // create new crate metadata
      data.metadataHandle = await data.dirHandle.getFileHandle('ro-crate-metadata.json', { create: true });
    } else {
      try {
        data.metadataHandle = await window.showSaveFilePicker({
          suggestedName: 'ro-crate-metadata.json',
          types: [{
            description: 'RO-Crate Metadata File',
            accept: { 'application/json': ['.json'] }
          }]
        });
      } catch (error) {
      }
    }
    if (data.metadataHandle) {
      const writable = await data.metadataHandle.createWritable();
      const content = JSON.stringify(editor.value.crate, null, 2);
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

async function processFiles({ dirHandle, root }) {
  for await (const [key, handle] of dirHandle.entries()) {
    let filePath = root ? root + '/' + key : key;
    if (handle.kind === 'directory' && !notThisFiles.includes(key)) {
      await processFiles({ dirHandle: handle, root: filePath });
    } else if (handle.kind === 'file' && !notThisFiles.includes(key)) {
      const file = {
        "@id": filePath,
        "@type": "File"
      };
      editor.value.updateCrate(crate => {
        crate.addValues(crate.rootDataset, 'hasPart', file);
      });
    }
  }
}

function updateEntity({ property, value }) {
  //  data.entity[property] = value;
}

</script>

<template>
  <div class="p-2 bg-slate-200">
    <el-form :inline="true">
      <el-form-item class="">
        <el-dropdown trigger="click" @command="command => commands[command]?.()">
          <el-button type="primary">File &nbsp;<el-icon class="el-icon--right">
              <ArrowDown />
            </el-icon></el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="open">
                <el-tooltip effect="dark" placement="right"
                  content="Open a directory to describe or select an empty directory">
                  Open Directory
                </el-tooltip>
              </el-dropdown-item>
              <el-dropdown-item command="addFiles" :disabled="data.dirHandle?.name === undefined">
                <el-tooltip effect="dark" placement="right" content="Load Files (With Selected Directory)">
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
                <el-tooltip effect="dark" placement="right" content="Load a new profile from your computer">
                  Load profile
                </el-tooltip>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-form-item>

      <el-form-item label="Profile:" class="w-9/12">
        <el-select v-model="data.selectedProfile" class="w-full" placeholder="Select a profile">
          <el-option v-for="(profile, index) of data.profiles" :label="profile.metadata.name" :value="index">
            <div class="border-b-1 mb-2">
              <p>{{ profile.metadata.name }}</p>
              <p class="text-slate-500 text-xs">{{ profile.metadata.description }}</p>
            </div>
          </el-option>
        </el-select>
      </el-form-item>
      <div v-if="data.dirHandle" class="text-large">Selected Directory:
        <span class="font-bold">{{ data.dirHandle.name }}</span>
      </div>
    </el-form>
  </div>

  <CrateEditor ref="editor" v-loading="data.loading" v-if="data.crate"
    v-model:entityId="data.entityId" :crate="data.crate" :profile="profile" @ready="data.loading=false">
  </CrateEditor>
  <div v-else>
    <welcome />
  </div>
</template>

<style>
.el-select-dropdown__item {
  height: auto;
}
</style>
