<script setup>
import { shallowReactive, reactive, ref, computed, watch, watchEffect, nextTick } from 'vue';
import { profiles } from '../../profiles';
import Welcome from "../components/Welcome.vue";
import Help from "../components/Help.vue";
import SpreadSheet from "../components/SpreadSheet.vue";
import { Validator } from "../utils/profileValidator.js";
import { first, isEmpty, isUndefined } from "lodash";
import { ROCrate } from "ro-crate";
import { ElRow, ElCol, ElMenu, ElMenuItem, ElDivider, ElSelect, ElOption, ElDialog, ElButton } from 'element-plus';
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
const defaultProfile = 0;

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
      // reset crate
      resetData();
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
      //navigate();
      //data.loading = false;
      console.log('end open')
    } catch (error) {
      console.error(error);
      window.alert(error);
    }
  },

  async addFiles() {
    const dirHandle = data.dirHandle;
    const files = await collectFiles({ dirHandle, root: '' });
    editor.value.setProperty(editor.value.rootDatasetId, 'hasPart', files);
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
      const crate = editor.value.crate;
      const writable = await data.metadataHandle.createWritable();
      const content = JSON.stringify(crate, null, 2);
      await writable.write(content);
      await writable.close();
      data.crate = crate;
      data.entityId = '';
      data.validationResult = validate(data.crate, profile.value);
      data.validationResultDialog = !isEmpty(data.validationResult);
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

// this is a workaround for el-select to revert the modelValue change to the valid option
watch(() => data.selectedProfile, (v, pv) => {
  if (v < 0) {
    data.selectedProfile = pv;
    commands.loadProfile();
  }
});


const validate = function (json, profile) {
  const crate = new ROCrate(json, { array: true, link: true });
  let validationResult = {};
  for (let entity of crate.entities()) {
    if (entity["@id"] !== 'ro-crate-metadata.json') {
      for (let entityType of entity['@type']) {
        const classDefinition = profile.classes[entityType];
        if (classDefinition) {
          for (let input of classDefinition.inputs) {
            if (input.required && (isUndefined(entity[input.name]) || entity[input.name][0] === '')) {
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
  console.log(raw);
  data.crate = raw;
}

</script>

<template>
  <div class="bg-slate-200">
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
        ﹖
      </el-menu-item>
    </el-menu>
    <el-row class="text-large p-3" :gutter="10">
      <el-col :xs="24" :sm="24" :md="12" :lg="12">
        <el-row class="w-full p-1">
          <el-select v-model="data.selectedProfile" placeholder="Select a mode" class="w-[30em]" :disabled="!data.dirHandle">
            <template #prefix>
              <span class="font-bold">Mode:</span>
            </template>
            <el-option :value="-1">
              <p class="font-bold italic">Load and add a new mode from your computer ...</p>
            </el-option>
            <el-option v-for="(profile, index) of data.profiles" :label="profile.metadata.name" :value="index">
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
            Selected Directory:&nbsp;<span class="font-bold">{{ data.dirHandle.name }}</span>
          </span>
        </el-row>
      </el-col>
    </el-row>
  </div>
  <template v-if="data.crate">
    <div v-if="data.validationResultDialog" class="bg-orange-100 text-orange-700 px-4 py-3 relative" role="alert">
      <strong class="block sm:inline font-bold">Saved with warnings</strong>
      <div class="p-2" v-for="(obj, key) in data.validationResult">
        <p>Entity:
          <el-button size="small" type="default" @click="goTo({ id: key })"> {{ first(obj?.name) || key }}</el-button>
        </p>
        Property(s) :
        <p v-for="(prop, keyProp) in obj.props" class="ml-5 py-1">
          <el-button size="small" @click="goTo({ id: key, prop: keyProp })">{{ prop.name }}</el-button>
          <span class="text-red-700">&nbsp;is {{ prop['type'] }}</span>
        </p>
      </div>
      <span class="absolute top-0 bottom-0 right-0 px-4 py-3">
        <el-button type="text" @click="data.validationResultDialog = false">
          <svg class="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20">
            <title>Close</title>
            <path
              d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
          </svg>
        </el-button>
      </span>
    </div>
    <CrateEditor ref="editor" v-loading="data.loading" :crate="data.crate" :profile="profile" :entityId="data.entityId"
      :propertyId="data.propertyId" :get-file="getFile" @update:entityId="updateEntityId" @update:crate="updateCrate"
      @ready="data.loading = false" @data="detectProfile">
    </CrateEditor>
    <SpreadSheet v-model:crate="data.crate" :buffer="data.spreadSheetBuffer" />
  </template>
  <div v-else>
    <welcome />
  </div>
  <el-dialog v-if="data.profileErrorDialog" v-model="data.profileError" :title="'Error when loading Profile'" width="50%">
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
</style>
