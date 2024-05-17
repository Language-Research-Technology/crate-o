<script setup>
import { shallowReactive, reactive, ref, computed, watch, watchEffect, nextTick } from 'vue';
import { profiles, profilesPromise } from '../utils/profiles.js';
import Welcome from "../components/Welcome.vue";
import Help from "../components/Help.vue";
import SpreadSheet from "../components/SpreadSheet.vue";
import { Validator } from "../utils/profileValidator.js";
import { ROCrate } from "ro-crate";
import { ElRow, ElCol, ElMenu, ElMenuItem, ElDivider, ElSelect, ElOption, 
  ElDialog, ElButton, ElCollapse, ElCollapseItem, ElAlert, ElNotification  } from 'element-plus';
import { handleRoute } from '../../lib/DefaultRouteHandler.js'
import { CrateEditor } from '../../lib'

const navigate = handleRoute((entityId, propertyId) => {
  if (data.metadataHandle) {
    console.log('handleRoute, set entityId', entityId)
    data.entityId = entityId;
    data.propertyId = propertyId;
  }
});
//const $router = useRouter();

const emit = defineEmits(['load:spreadsheet']);
const defaultProfile = undefined;

const data = shallowReactive({
  /** @type {?FileSystemDirectoryHandle} */
  dirHandle: null,
  /** @type {?FileSystemFileHandle} */
  metadataHandle: null,
  crate: null,
  entityId: '',
  propertyId: '',
  selectedProfile: defaultProfile,
  profiles: shallowReactive(profiles),
  spreadSheetBuffer: null,
  loading: false,
  profileError: [],
  profileErrorDialog: false,
  validationResult: {},
  showWelcome: false,
  validationResultDialog: false
});
window.data = data;
const profile = computed(() => data.profiles[data.selectedProfile]);

const editor = ref();

const commands = {
  async loadProfile() {
    console.log('loading profile');
    try {
      const [profileHandle] = await window.showOpenFilePicker();
      let file = await profileHandle.getFile();
      const content = await file.text();
      const validator = new Validator();
      validator.errors = [];
      validator.loadAndCheck(content);
      data.profileError = null;
      data.profileErrorDialog = false;
      if (validator.errors.length > 0) {
        data.profileError = validator.errors;
        data.profileErrorDialog = true;
      } else {
        //const profile = validator.profile;
        //TODO: put it profiles removing it when fixing it
        const newProfile = validator.profile;
        data.profiles.unshift(newProfile);
        data.selectedProfile = 0;
        //profile = newProfile;
      }
    } catch (error) {
      console.error(error);
      window.alert(error);
    }
  },

  async open() {
    console.log('open');
    try {
      data.dirHandle = await window.showDirectoryPicker();
      data.loading = true;
      try {
        data.metadataHandle = null;
        data.metadataHandle = await data.dirHandle.getFileHandle('ro-crate-metadata.json');
      } catch (error) {
        try {
          data.metadataHandle = await data.dirHandle.getFileHandle('ro-crate-metadata.jsonld');
        } catch (error) {
          //No metadataHandle found start a new Crate
        }
      }
      let crate = {};
      if (data.metadataHandle) {
        let file = await data.metadataHandle.getFile();
        const content = await file.text();
        crate = JSON.parse(content);
      }
      await profilesPromise;
      console.log(crate);
      data.crate = crate;
      console.log(data.crate);
      //navigate();
      //data.loading = false;
      // reset crate
      resetData();
    } catch (error) {
      console.error(error);
      window.alert(error);
    }
    console.log('end open')
  },

  async addFiles() {
    const dirHandle = data.dirHandle;
    const files = await collectFiles({ dirHandle, root: '' });
    editor.value.setProperty(editor.value.rootDatasetId, 'hasPart', files);
  },

  async save() {
    console.log('save start');
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
      const crate = editor.value.crate;
      const writable = await data.metadataHandle.createWritable();
      const content = JSON.stringify(crate, null, 2);
      await writable.write(content);
      await writable.close();
      //data.crate = crate;
      //data.entityId = '';
      data.validationResult = validate(crate, profile.value);
      console.log(data.validationResult);
      data.validationResultDialog = !!Object.keys(data.validationResult).length;
      ElNotification({ title: 'Data successfully saved in ro-crate-metadata.json', type: 'success', duration: 3000 });
    }
  },

  close() {
    data.dirHandle = null;
    data.metadataHandle = null;
    data.crate = null;
    resetData();
    navigate();
  },

  async loadSpreadsheet() {

    const [excelHandle] = await window.showOpenFilePicker({
      types: [{
        description: 'Excel File with RO-Crate columns',
        accept: { 'application/vnd.ms-excel': ['.xlsx'] }
      }]
    });
    let file = await excelHandle.getFile();
    const buffer = await file.arrayBuffer();
    data.crate = editor.value.crate;
    data.spreadSheetBuffer = buffer;
  },

  help() {
    data.showWelcome = true;
  }
};

const excludedFiles = {
  'ro-crate-metadata.json': '',
  'node_modules': ''
};

function detectProfile(roc) {
  const conformsToCrate = roc.rootDataset['conformsTo'] || [];
  const profileIndex = data.profiles.findIndex(p =>
    conformsToCrate.some(ct => (p?.conformsToUri || []).includes(ct['@id'])));
  data.selectedProfile = profileIndex >= 0 ? profileIndex : 0;
}

function resetData() {
  data.entityId = '';
  data.selectedProfile = defaultProfile;
  //data.profiles = shallowReactive(profiles);
  data.spreadSheetBuffer = null;
  data.validationResultDialog = false;
  data.validationResult = {};
  data.loading = false;
}

function updateEntityId(id, pages) {
  console.log('updateEntityId', id);
  navigate(id, '', pages);
}

/**
 *
 * @param {object} param0
 * @param {FileSystemDirectoryHandle} param0.dirHandle
 * @param {string} param0.root
 */
async function collectFiles({ dirHandle, root }) {
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
      files.push({ "@id": name, "@type": "File" });
    }
  }
  return files;
}

const validate = function (json, profile) {
  const crate = new ROCrate(json, { array: true, link: true });
  let validationResult = {};
  for (let entity of crate.entities()) {
    if (entity["@id"] !== 'ro-crate-metadata.json') {
      for (let entityType of entity['@type']) {
        const classDefinition = profile.classes[entityType];
        if (classDefinition) {
          for (let input of classDefinition.inputs) {
            if (input.required && !(entity[input.name]?.[0])) {
              //TODO: check that the input value is valid
              if (!validationResult[entity['@id']]) {
                validationResult[entity['@id']] = { 'name': entity['name'], props: {} };
              }
              validationResult[entity["@id"]].props[input.id] = { name: input.name, type: 'required' };
            }
          }
        }
      }
    }
  }
  return validationResult;
}

const goTo = function ({ id, prop }) {
  if (data.entityId !== id || prop) {
    navigate(id, prop);
  }
}

var prevObjectUrl;
async function getFile(id) {
  try {
    const paths = id.split('/');
    const fileName = paths.pop();
    let dirHandle = data.dirHandle;
    for (let p of paths) {
      dirHandle = await dirHandle.getDirectoryHandle(p);
    }
    const fileHandle = await dirHandle.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    return {
      id,
      type: file.type,
      name: file.name,
      get url() {
        if (prevObjectUrl) {
          URL.revokeObjectURL(prevObjectUrl);
        }
        prevObjectUrl = URL.createObjectURL(file);
        return prevObjectUrl;
      },
      async text() {
        return file.text();
      }
    }
  } catch (e) {
    console.error(e);
  }
}

function updateCrate(raw, roc) {
  console.log('updateCrate');
  console.log(raw);
  data.crate = raw;
}

function selectProfile(v) {
  if (v < 0) {
    commands.loadProfile();
  } else {
    data.selectedProfile = v;
  }
}
const activeNames = ref(['1']);
</script>

<template>
  <div class="bg-slate-200" v-loading.fullscreen="data.loading">
    <el-menu default-active="-1" class="" background-color="#ecf5ff" text-color="#000" mode="horizontal"
      @select="(key) => commands[key]()">
      <el-menu-item index="open">
        📂 Open Directory
      </el-menu-item>
      <el-menu-item index="addFiles" :disabled="!data.dirHandle">
        🗃️ Load Files
      </el-menu-item>
      <el-menu-item index="loadSpreadsheet" :disabled="!data.dirHandle">
        🗄️ Bulk Add
      </el-menu-item>
      <el-menu-item index="save" :disabled="!data.dirHandle">
        💾 Save
      </el-menu-item>
      <el-menu-item index="close" :disabled="!data.dirHandle">
        ⓧ Close
      </el-menu-item>
      <el-menu-item index="help" title="Help">
        ﹖ Help
      </el-menu-item>
    </el-menu>
    <el-row class="text-large p-3" :gutter="10">
      <el-col :xs="24" :sm="24" :md="12" :lg="12">
        <el-row class="w-full p-1">
          <el-select :model-value="data.selectedProfile" @update:model-value="selectProfile"
            placeholder="Open a directory first to select a mode" class="w-[30em]" :disabled="!data.dirHandle">
            <template #prefix>
              <span class="font-bold">Mode:</span>
            </template>
            <el-option :value="-1">
              <p class="font-bold italic">Load and add a new mode from your computer ...</p>
            </el-option>
            <el-option v-for="(profile, index) of data.profiles" v-if="profile" :label="profile.metadata.name"
              :value="index">
              <div class="border-b-1 mb-2">
                <p>{{ profile.metadata.name }}</p>
                <p class="text-slate-500 text-xs">{{ profile.metadata.description }}</p>
              </div>
            </el-option>
          </el-select>
        </el-row>
      </el-col>
      <el-col v-if="data.dirHandle" :xs="24" :sm="24" :md="12" :lg="12">
        <el-row class="p-1">
          <span class="flex items-center">
            <span class="font-bold text-slate-500">Selected Directory:</span>&nbsp;<span>{{ data.dirHandle.name
              }}</span>
          </span>
        </el-row>
      </el-col>
    </el-row>
  </div>
  <template v-if="data.crate">
    <el-alert class="validation-warnings" v-if="data.validationResultDialog" type="warning" @close="data.validationResultDialog = false">
      <el-collapse class="ml-5 mr-10 min-w-96" role="alert">
        <el-collapse-item title="Saved with warnings" name="validation-warnings">
          <div class="p-2" v-for="(obj, key) in data.validationResult">
            <p>Entity:
              <el-button size="small" type="default" @click="goTo({ id: key })"> {{ obj?.name?.[0] || key }}</el-button>
            </p>
            Property(s) :
            <p v-for="(prop, keyProp) in obj.props" class="ml-5 py-1">
              <el-button size="small" @click="goTo({ id: key, prop: keyProp })">{{ prop.name }}</el-button>
              <span class="text-red-700">&nbsp;is {{ prop['type'] }}</span>
            </p>
          </div>
        </el-collapse-item>
      </el-collapse>
    </el-alert>
      <!-- <strong class="block sm:inline font-bold">Saved with warnings</strong> -->
      <!-- <span class="absolute top-0 bottom-0 right-0 px-4 py-3">
        <el-button type="text" @click="data.validationResultDialog = false">
          <svg class="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20">
            <title>Close</title>
            <path
              d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
          </svg>
        </el-button>
      </span> -->
    <CrateEditor ref="editor" :crate="data.crate" :profile="profile" :entityId="data.entityId"
      :propertyId="data.propertyId" :get-file="getFile" @update:entityId="updateEntityId" @update:crate="updateCrate"
      @ready="() => data.loading = false" @data="detectProfile">
    </CrateEditor>
    <SpreadSheet v-model:crate="data.crate" :buffer="data.spreadSheetBuffer" />
  </template>
  <div v-else>
    <welcome />
  </div>
  <el-dialog v-if="data.profileErrorDialog" v-model="data.profileError" :title="'Error when loading Mode'"
    width="50%">
    <div class="overflow-x-scroll h-96">
      {{ data.selectedProfile?.metadata }}
      <el-divider />
      <div class="p-2" v-for="error of data.profileError">
        <p>
          {{ error.instancePath }}
        </p>
        <p>
          {{ error.message }}
        </p>
        <el-divider />
      </div>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" @click="data.profileErrorDialog = false">Ok</el-button>
      </span>
    </template>
  </el-dialog>

  <el-dialog v-if="data.showWelcome" v-model="data.showWelcome" title="Help" width="50%">
    <div class="overflow-x-scroll h-96">
      <help />
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" @click="data.showWelcome = false">Close</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style>
.el-select-dropdown__item {
  height: auto;
}
/* .validation-warnings .el-alert__content {
  flex-grow: 1;
} */
.validation-warnings .el-collapse {
  --el-collapse-header-bg-color: transparent;
  --el-collapse-content-bg-color: transparent;
  --el-collapse-header-font-size: 14px;
  --el-collapse-header-text-color: inherit;
  --el-collapse-content-text-color: inherit;
}
</style>
