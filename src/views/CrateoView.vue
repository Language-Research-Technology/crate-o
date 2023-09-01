<script setup>
import {shallowReactive, reactive, ref, computed, watch} from 'vue';
import {profiles} from '@/profiles';
import Welcome from "@/components/Welcome.vue";
import {HomeFilled, ArrowLeftBold, ArrowDown} from '@element-plus/icons-vue';
import SpreadSheet from "@/components/SpreadSheet.vue";

const emit = defineEmits(['load:spreadsheet']);
const defaultProfile = 0;

const data = shallowReactive({
  /** @type {?FileSystemDirectoryHandle} */
  dirHandle: null,
  /** @type {?FileSystemFileHandle} */
  metadataHandle: null,
  crate: null,
  entityId: '',
  selectedProfile: defaultProfile,
  profiles: shallowReactive(profiles),
  spreadSheetBuffer: null,
  loading: false,
});
//window.data = data;
const profile = computed(() => data.profiles[data.selectedProfile]);

const editor = ref();

const commands = {
  async loadProfile() {
    console.log('click');
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
      } else {
        data.crate = {};
      }
      //data.loading = false;
    } catch (error) {
      console.error(error);
      window.alert(error);
    }
  },

  async addFiles() {
    const dirHandle = data.dirHandle;
    editor.value.rootDataset.hasPart = await collectFiles({dirHandle, root: ''});
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
      const content = JSON.stringify(editor.value.crate, null, 2);
      await writable.write(content);
      await writable.close();
    }
  },

  close() {
    data.dirHandle = null;
    data.metadataHandle = null;
    data.crate = null;
    data.entityId = '';
    data.selectedProfile = defaultProfile;
    data.profiles = shallowReactive(profiles);
    data.spreadSheetBuffer = null;
    data.loading = false;
  },

  async loadSpreadsheet() {

    const [excelHandle] = await window.showOpenFilePicker({
      types: [{
        description: 'Excel File with RO-Crate columns',
        accept: {'application/vnd.ms-excel': ['.xlsx']}
      }]
    });
    let file = await excelHandle.getFile();
    const buffer = await file.arrayBuffer();
    data.crate = editor.value.crate;
    data.spreadSheetBuffer = buffer;
  }
};

const excludedFiles = {
  'ro-crate-metadata.json': '',
  'node_modules': ''
};

/**
 *
 * @param {object} param0
 * @param {FileSystemDirectoryHandle} param0.dirHandle
 * @param {string} param0.root
 */
async function collectFiles({dirHandle, root}) {
  const files = [];
  /** @type {[string, FileSystemFileHandle|FileSystemDirectoryHandle][]} */
  const stack = [[root, dirHandle]];
  /** @type {[string, FileSystemFileHandle|FileSystemDirectoryHandle]} */
  var entry;
  while ((entry = stack.pop())) {
    let [name, handle] = entry;
    if (handle.kind === 'directory') {
      if (name) name += '/'
      const entries = [];
      for await (const entry of handle.entries()) {
        entries.push(entry);
      }
      for (var i = entries.length; i--;) {
        const e = entries[i];
        if (!e[0].startsWith('.') && !(e[0] in excludedFiles)) {
          e[0] = name + e[0];
          stack.push(e);
        }
      }
    } else {
      files.push({"@id": name, "@type": "File"});
    }
  }
  return files;
}

// this is a workaround for el-select to revert the modelValue change to the valid option
watch(() => data.selectedProfile, (v, pv) => {
  if (v < 0) {
    data.selectedProfile = pv;
    commands.loadProfile();
  }
});

</script>

<template>
  <div class="p-2 bg-slate-200">
    <el-form :inline="true">
      <el-form-item class="">
        <el-dropdown trigger="click" @command="command => commands[command]?.()">
          <el-button type="primary">File &nbsp;<el-icon class="el-icon--right">
            <ArrowDown/>
          </el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="open">
                <el-tooltip effect="dark" placement="right"
                            content="Open a directory to describe or select an empty directory">
                  Open Directory
                </el-tooltip>
              </el-dropdown-item>
              <el-dropdown-item command="addFiles" :disabled="!data.dirHandle">
                <el-tooltip effect="dark" placement="right" content="Load Files (With Selected Directory)">
                  Load Files
                </el-tooltip>
              </el-dropdown-item>
              <el-dropdown-menu>
                <el-dropdown-item command="loadSpreadsheet" :disabled="!data.dirHandle">
                  <el-tooltip effect="dark" placement="right" content="Add Metadata from Spreadsheet">
                    Load Spreadsheet
                  </el-tooltip>
                </el-dropdown-item>
              </el-dropdown-menu>
              <el-dropdown-item command="save" :disabled="!data.dirHandle">
                <el-tooltip effect="dark" placement="right"
                            content="Save crate metadata to the currently opened directory">
                  Save Progress
                </el-tooltip>
              </el-dropdown-item>
              <el-dropdown-item command="close" :disabled="!data.dirHandle">
                <el-tooltip effect="dark" placement="right"
                            content="Closes without saving">
                  Close
                </el-tooltip>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <div>&nbsp;</div>
      </el-form-item>

      <el-form-item label="Profile:" class="w-9/12">
        <el-select v-model="data.selectedProfile" class="w-full" placeholder="Select a profile">
          <el-option :value="-1">
            <p class="font-bold italic">Load and add a new profile from your computer ...</p>
          </el-option>
          <el-option v-for="(profile, index) of data.profiles" :label="profile.metadata.name" :value="index">
            <div class="border-b-1 mb-2">
              <p>{{ profile.metadata.name }}</p>
              <p class="text-slate-500 text-xs">{{ profile.metadata.description }}</p>
            </div>
          </el-option>
        </el-select>
      </el-form-item>
      <div v-if="data.dirHandle" class="text-large pt-3 pb-1">Selected Directory:
        <span class="font-bold">{{ data.dirHandle.name }}</span>
      </div>
    </el-form>
  </div>
  <template v-if="data.crate">
    <CrateEditor ref="editor" v-loading="data.loading" v-model:entityId="data.entityId"
                 :crate="data.crate" :profile="profile" @ready="data.loading = false">
    </CrateEditor>
    <SpreadSheet v-model:crate="data.crate" :buffer="data.spreadSheetBuffer"/>

  </template>
  <div v-else>
    <welcome/>
  </div>
</template>

<style>
.el-select-dropdown__item {
  height: auto;
}
</style>
