<script setup>
import {reactive, onMounted, watch, onUpdated, ref, inject, provide, toRaw} from 'vue';
import {useRouter, useRoute} from 'vue-router'
import {profiles} from '@/profiles';
import {ROCrate} from 'ro-crate';
import EntityProperty from "@/components/EntityProperty.vue";
import {first, find, uniqBy} from 'lodash';
import {v4 as uuidv4} from 'uuid';
import Welcome from "@/components/Welcome.vue";
import EntityLinks from "@/components/EntityLinks.vue";

//import {crateDataService} from "@/crate.service";
const entitiesByType = {};
const crateDataService = (type, queryString) => {
  if (!crate) {
    return [];
  }
  if (!entitiesByType[type]) {
    const regexp = new RegExp(type);
    entitiesByType[type] = Array.from(crate.entities({filter: {'@type': regexp}}));
  }
  const results = queryString
      ? entitiesByType[type].filter((e) => {
        for (const name of e.name) {
          return name.toLowerCase().indexOf(queryString.toLowerCase()) > -1;
        }
      })
      : entitiesByType[type];

  return results;
}

provide('dataService', crateDataService);

const $router = useRouter();
const $route = useRoute();

let crate;
const selectedProfile = 1;

const notThisFiles = [
  'ro-crate-metadata.json',
  '.DS_Store',
  '.git',
  'node_modules'
];

function updateBreadcrumb(index) {
  data.breadcrumb.splice(index + 1, data.breadcrumb.length - (index + 1));
  updateRoute(data.breadcrumb[index]['@id']);
}

function loadEntity(id) {
  data.entity = crate.getItem(id);
  if (data.entity) {
    data.entityId = data.entity['@id'];
    data.definitions = getProfileClasses();
    data.entityTypesDefinitions = getEntityTypesDefinitions();
    $router.push({query: {id: encodeURIComponent(id)}});
    if (id !== data.rootId) {
      const index = data.breadcrumb.findIndex(b => b['@id'] === id);
      if (index >= 0) {
        data.breadcrumb.splice(index + 1, data.breadcrumb.length - (index + 1));
      } else {
        data.breadcrumb.push(data.entity);
      }
    } else {
      data.breadcrumb = [];
    }
  } else {
    if (confirm('No reference found in this crate, would you like to try to open it in a tab?')) {
      window.open(id, '_blank').focus();
    }
    loadEntity(data.entityId);
  }
}

const data = reactive({
  test: 'a',
  entity: {},
  entities: [],
  entityTypesDefinitions: [],
  rootId: '',
  rootName: '',
  profiles: profiles,
  profile: profiles[selectedProfile],
  loading: false,
  /** @type {?FileSystemFileHandle} */
  metadataHandle: null,
  /** @type {?FileSystemDirectoryHandle} */
  dirHandle: null,
  selectedProfile: selectedProfile,
  breadcrumb: [],
  definitions: [],
  entitySpan: 24,
  showPropsFirst: ["name", "description"],
  addItemSpan: 0,
  activeTab: 'first'
});

onMounted(() => {
  if (!data.entityId) {
    $router.push({query: null});
  }
})

function getProfileClasses(type) {
  const classes = data.profile?.classes;
  let types = type || data.entity?.['@type'];
  const defs = [];
  for (let c of Object.keys(classes)) {
    if (types.includes(c)) {
      defs.push(classes[c])
    }
  }
  return defs;
}

function getEntityTypesDefinitions() {
  // Note: I'm sure you can do this in one line with lodash :P
  const classes = data.profile?.classes;
  //console.log("CLASSES", classes)
  let types = data.entity?.['@type'];
  let profileInputs = [];
  for (let t of types) {
    if (classes[t]) {
      if (classes[t].inputs) {
        profileInputs = profileInputs.concat(toRaw(classes[t].inputs));
      }
    }
  }
  const fileInputs = [];
  for (const prop in data.entity) {
    let exists = false;
    for (let i of profileInputs) {
      // console.log("checking", prop, i?.id, crate.resolveTerm(prop))
      if (i?.id === prop || i?.id === crate.resolveTerm(prop)) {
        exists = true;
        // console.log("Found repeat", prop,)
      }
    }
    if (!exists) {
      const newProp = {
        "id": crate.resolveTerm(prop),
        "name": prop,
        "type": ["Text"]
      }
      fileInputs.push(newProp);
    }
  }
  const inputs = fileInputs.concat(profileInputs);
  return uniqBy(inputs, 'name'); //Changed to name, if resolveTerm is undefined cannot get uniques
}

function findPropertyDefinition(property) {
  //TODO: Use data.entityTypesDefinitions!
  //TODO: Merge the types!
  //There might be more types in the inputs so merge them!
  if (data.definitions.length > 0) {
    const def = find(data.definitions[0].inputs, p => p.name === property);
    if (def) {
      return def;
    }
  }
}

watch($route, (c, o) => {
  if (!data.metadataHandle) { //checking crate if it has not been loaded
  } else {
    if (c.query?.id) {
      const id = decodeURIComponent(c.query?.id);
      if (id) {
        loadEntity(id);
      }
    }
  }
});

function updateRoute(id) {
  loadEntity(id);
  $router.push({query: {id: encodeURIComponent(id)}});
}

const commands = {
  async newCrate() {
    crate = new ROCrate({}, {array: true, link: true});
    data.metadataHandle = null;
  },
  async openFile() {
    [data.metadataHandle] = await window.showOpenFilePicker({
      types: [{
        description: 'RO-Crate Metadata File', accept: {
          'application/ld+json': ['.jsonld'], 'application/json': ['.json']
        }
      }]
    });
    let file = await data.metadataHandle.getFile();
    const content = await file.text();
    crate = JSON.parse(content);
  },

  async loadProfile() {
    try {
      const [profileHandle] = await window.showOpenFilePicker();
      let file = await profileHandle.getFile();
      const prof = await file.text();
      data.profile = JSON.parse(prof);
      data.profiles.push(data.profile);
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
        let file = await data.metadataHandle.getFile();
        const content = await file.text();
        crate = new ROCrate(JSON.parse(content), {array: true, link: true});
      } else {
        crate = new ROCrate({}, {array: true, link: true});
      }
      data.entity = crate.rootDataset;
      data.entityId = data.rootId = crate.rootId;
      data.rootName = first(crate.rootDataset['name']) || 'Start';
      data.entities = Array.from(crate.entities());
      loadEntity(crate.rootId);
    } catch (error) {
      console.error(error);
      window.alert(error);
    }
  },

  async addFiles() {
    let newCrate = new ROCrate(crate);
    const dirHandle = data.dirHandle;
    await processFiles({crate, dirHandle, root: ''});
    //crate = newCrate.toJSON();
    updateRoute(data.rootId);
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
      const content = JSON.stringify(crate, null, 2);
      await writable.write(content);
      await writable.close();
    }
  }
};

function changeProfile(index) {
  data.profile = profiles[index];
}

function handleFileCommand(command) {
  if (command in commands) commands[command]();
}

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

function addItem({reference, type, property}) {
  const classes = data.profile?.classes;
  const definitions = classes?.[type];
  const newItem = {
    "@id": crate.uniqueId('#entity-'),
    "@type": type
  }
  const inputs = definitions?.inputs || [];
  for (let item of inputs) {
    if (item.multiple) { // does this matter?
      newItem[item.name] = [""];
    } else {
      newItem[item.name] = "";
    }
  }
  crate.addValues(reference, property, newItem);
  loadEntity(newItem['@id']);
}

function browseEntities() {

}

function addItemSelectType({reference}) {
  data.addItemSpan = 6;
  data.entitySpan = 18;
}

function hideAddItemSelectType() {
  data.addItemSpan = 0;
  data.entitySpan = 24;
}

</script>

<template>
  <el-form :inline="true" class="bg-slate-200 p-2">
    <el-form-item class="">
      <el-dropdown trigger="click" @command="handleFileCommand">
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
    <el-form-item label="Profile:" class="w-8/12">
      <el-select v-model="data.selectedProfile" class="w-full" placeholder="Select" @change="changeProfile">
        <el-option v-for="(profile, index) of data.profiles" :label="profile.metadata.name" :value="index"
                   class="w-auto">
          <span>{{ profile.metadata.name }}</span>&nbsp;
          <span>{{ profile.metadata.description }}</span>
        </el-option>
      </el-select>
    </el-form-item>
    <div v-if="data.dirHandle" class="text-large font-600">Selected Directory: {{ data.dirHandle.name }}</div>
  </el-form>
  <el-row class="pt-5 bg-slate-300 p-2" v-if="data.dirHandle">
    <el-col :span="20" class="pl-5">
      <span>
        <el-button :link="true"
                   @click="updateRoute(data.rootId)">
          {{ data.rootName }}
        </el-button>
        /
      </span>
      <span v-for="(b,i) in data.breadcrumb">
        <el-button :link="true"
                   @click="updateBreadcrumb(i)"
                   :disabled="b['@id'] === data.entity?.['@id']"
        >{{ b.name?.[0] || b['@id'] }}
        </el-button>
        /
      </span>
    </el-col>
    <el-col :span="4">
      <!--      <el-button :link="true" v-show="data.addItemSpan===0"-->
      <!--                 title="This will delete the entity and all its references"-->
      <!--                 @click="addItemSelectType({reference: data.rootId })"><i-->
      <!--          class="fa-solid fa-trash"></i>Delete Entity-->
      <!--      </el-button>-->
    </el-col>
  </el-row>
  <el-row class="crate-o" v-if="data.dirHandle">
    <el-col :span="16" class="p-2">
      <el-form label-width="150px">
        <template v-for="def in data.entityTypesDefinitions" :key="uuidv4()">
          <entity-property v-if="data.entity?.[def.name]"
                           :key="def.name"
                           :property="def.name"
                           :value="data.entity?.[def.name]"
                           :index="0"
                           :id="data.entity?.['@id']"
                           :definition="findPropertyDefinition(def.name)"
                           :lookup="data.profile.lookup"
                           @load-entity="loadEntity"
                           @update-entity="updateEntity"
                           @delete-entity=""
                           @add-item="addItem"/>
          <div v-else>
            <entity-property
                :key="def.name"
                :property="def.name"
                :index="0"
                :value="data.entity?.[def.name] || ''"
                :id="data.entity?.['@id'] || ''"
                :definition="findPropertyDefinition(def.name)"
                :lookup="data.profile.lookup"
                @load-entity="loadEntity"
                @update-entity="updateEntity"
                @delete-entity=""
                @add-item="addItem"/>
          </div>
        </template>
      </el-form>
    </el-col>
    <el-col :span="8"
            class="h-screen p-2">
      <el-row class="p-2">
        <el-tabs class="w-full" v-model="data.activeTab">
          <el-tab-pane label="All Entities" name="first">
            <entity-links
                :value="data.entities"
                @update-route="updateRoute"
                :icon="'fa-pencil'"/>
          </el-tab-pane>
          <el-tab-pane label="Reverse Links" name="second">
            <entity-links v-if="data.entity?.['@reverse']"
                          v-for="key in Object.keys(data.entity['@reverse'])"
                          :key="key"
                          :value="data.entity['@reverse'][key]"
                          @update-route="updateRoute"
                          :icon="'fa-arrow-left'"/>
          </el-tab-pane>
        </el-tabs>
      </el-row>
    </el-col>
  </el-row>
  <div v-else>
    <welcome/>
  </div>

</template>

<style>

</style>
