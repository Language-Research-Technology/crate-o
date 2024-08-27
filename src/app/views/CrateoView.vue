<script setup>
import { shallowReactive, ref, computed } from 'vue';
import { profilesPromise } from '../utils/profiles.js';
import About from "../components/About.vue";
import Help from "../components/Help.vue";
import SpreadSheet from "../components/SpreadSheet.vue";
import { Validator } from "../utils/profileValidator.js";
import { ROCrate } from "ro-crate";
import {
  ElRow, ElCol, ElMenu, ElMenuItem, ElDivider, ElSelectV2, ElOption,
  ElDialog, ElButton, ElCollapse, ElCollapseItem, ElAlert, ElNotification
} from 'element-plus';
import { handleRoute } from '../../lib/DefaultRouteHandler.js';
import { CrateEditor } from '../../lib';
import { Preview } from 'ro-crate-html';
import renderTemplate from 'virtual:ejs';

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
  profiles: [],
  spreadSheetBuffer: null,
  loading: false,
  modeError: [],
  validationResult: {},
  showDialog: false,
  dialogTitle: '',
  dialogContent: null,
  validationResultDialog: false
});
window.data = data;
const profile = computed(() => data.profiles[data.selectedProfile]);
const profileOptions = computed(() => data.profiles.flatMap((p, value) =>
  p ? [{ value, label: p.metadata.name, description: p.metadata.description }] : []));

//const editor = ref();
const editor = { crate: {}, refresh: () => { } };

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
      data.modeError = null;
      //data.profileErrorDialog = false;
      if (validator.errors.length > 0) {
        data.modeError = validator.errors;
        data.showDialog = true;
        data.dialogContent = null;
        data.dialogTitle = 'Error when loading Mode';
      } else {
        //const profile = validator.profile;
        //TODO: put it profiles removing it when fixing it
        const newProfile = validator.profile;
        data.profiles.unshift(newProfile);
        data.selectedProfile = 0;
        //profile = newProfile;
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error(error);
        window.alert(error);
      }
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
      const profiles = (await profilesPromise).map(p => p.value);
      data.profiles = shallowReactive(profiles)
      //console.log(crate);
      data.crate = crate;
      console.log(data.crate);
      //navigate();
      //data.loading = false;
      // reset crate
      resetData();
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error(error);
        window.alert(error);
      }
    }
    console.log('end open')
  },

  async addFiles() {
    const dirHandle = data.dirHandle;
    const files = await collectFiles({ dirHandle, root: '' });
    editor.crate.setProperty(editor.crate.rootId, 'hasPart', files);
    editor.refresh();
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
      const rawCrate = editor.crate.toJSON();
      let writable = await data.metadataHandle.createWritable();
      let content = JSON.stringify(rawCrate, null, 2);
      await writable.write(content);
      await writable.close();
      //data.crate = crate;
      //data.entityId = '';
      data.validationResult = validate(rawCrate, profile.value);
      console.log(data.validationResult);
      data.validationResultDialog = !!Object.keys(data.validationResult).length;
      ElNotification({ title: 'Data successfully saved in ro-crate-metadata.json', type: 'success', duration: 3000 });

      // save preview
      const crate = new ROCrate(rawCrate, { array: true, link: true });
      await crate.resolveContext();
      const preview = new Preview(crate);
      content = renderTemplate(preview.templateParams());
      const previewHandle = await data.dirHandle.getFileHandle('ro-crate-preview.html', { create: true });
      writable = await previewHandle.createWritable();
      await writable.write(content);
      await writable.close();
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
    data.crate = editor.crate;
    data.spreadSheetBuffer = buffer;
  },

  help() {
    data.dialogTitle = 'Help';
    data.dialogContent = Help;
    data.showDialog = true;
  },
  about() {
    data.dialogTitle = 'About';
    data.dialogContent = About;
    data.showDialog = true;
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

function ready(roc, refresh) {
  const conformsToCrate = roc.rootDataset['conformsTo'] || [];
  const profileIndex = data.profiles.findIndex(p =>
    conformsToCrate.some(ct => (p?.conformsToUri || []).includes(ct['@id'])));
  data.selectedProfile = profileIndex >= 0 ? profileIndex : 0;
  data.loading = false;
  console.log('ready');
  editor.crate = roc;
  editor.refresh = refresh;
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
        ❌ Close
      </el-menu-item>
      <el-menu-item index="help" title="Help">
        ❓ Help
      </el-menu-item>
      <el-menu-item index="about" title="About">
        🛈 About
      </el-menu-item>

    </el-menu>
    <el-row class="text-large py-3">
      <el-col :sm="24" :md="18" class="pl-3">
        <el-select-v2 v-model="data.selectedProfile" class="w-[30em]" :disabled="!data.dirHandle" scrollbar-always-on
          placeholder="Open a directory first to select a mode" :options="profileOptions" :height="290"
          :item-height="58">
          <template #prefix>
            <span class="font-bold">Mode:</span>
          </template>
          <template #footer>
            <el-button size="small" @click="commands.loadProfile()">Load and add a new mode from your computer
              ...</el-button>
          </template>
          <template #default="{ item }">
            <div class="border-b-1 mb-2" v-if="item" :title="item.description">
              <p>{{ item.label }}</p>
              <p class="text-slate-500 text-xs truncate">{{ item.description }}</p>
            </div>
          </template>
        </el-select-v2>
      </el-col>
      <el-col v-if="data.dirHandle" :sm="24" :md="6" class="content-center pl-3">
        <span class="font-bold text-slate-500">Selected Directory: </span>
        <span class="truncate" :title="data.dirHandle.name">{{ data.dirHandle.name }}</span>
      </el-col>
    </el-row>
  </div>
  <template v-if="data.crate">
    <el-alert class="validation-warnings" v-if="data.validationResultDialog" type="warning"
      @close="data.validationResultDialog = false">
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
    <CrateEditor :crate="data.crate" :mode="profile" :entity-id="data.entityId" :property-id="data.propertyId"
      :load-file="getFile" @update:entity-id="updateEntityId" @ready="ready">
    </CrateEditor>
    <SpreadSheet v-model:crate="data.crate" :buffer="data.spreadSheetBuffer" />
  </template>
  <div v-else>
    <div class="p-5 lg:p-20 lg:max-w-[75%]">
      <about />
      <help />
    </div>
  </div>

  <el-dialog v-model="data.showDialog" :title="data.dialogTitle" width="800" align-center>
    <div class="dialog-content">
      <component v-if="data.dialogContent" :is="data.dialogContent" />
      <template v-else-if="data.modeError">
        {{ data.selectedProfile?.metadata }}
        <el-divider />
        <div class="p-2" v-for="error of data.modeError">
          <p>{{ error.instancePath }}</p>
          <p>{{ error.message }}</p>
          <el-divider />
        </div>
      </template>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" @click="data.showDialog = false">Close</el-button>
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

.el-dialog {
  width: unset;
  max-width: var(--el-dialog-width);
}

.el-dialog .el-dialog__body {
  max-height: calc(100svh - 200px);
  overflow: auto;
}
</style>
