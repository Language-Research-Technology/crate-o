<script setup>
import {reactive, ref, onMounted, inject, onUpdated} from "vue";
import EntityInput from "@/components/EntityInput.vue";

import {lookup as datapack} from "@/datapack";
import {lookup as ror} from "@/ror";

const lookups = {datapack, ror}
const search = inject('dataService');

const props = defineProps(['definition', 'property', 'id', 'lookup']);
const data = reactive({
  showNewItem: undefined,
  lookupState: undefined,
  canLookup: false
});

const emit = defineEmits(['addItem', 'linkItem', 'addProperty']);
const entities = ref([])
const autoCompleteState = ref({});
let currentType;

function newItem({type}) {
  console.log(props.lookup);
  if (props?.lookup[type]) {
    data.canLookup = true;
  }
  if (['Text', 'TextArea'].includes(type)) {
    emit('addProperty');
  } else {
    data.showNewItem = type;
  }
}

function addItem({type}) {
  emit('addItem', {reference: props.id, type, property: props.property});
}

function queryByType(type) {
  currentType = type;
  return querySearch;
}

function querySearch(queryString, cb) {
  const results = search(currentType, queryString);
  // call callback function to return suggestion objects
  cb(results);
}

function handleSelect(item) {
  emit('linkItem', {item})
}

async function lookupQuery(query) {
  let result;
  const fields = props.lookup[data.showNewItem].fields;
  return lookups[props.lookup[data.showNewItem].type]({query, fields});
}


</script>
<template>
  <div v-if="definition?.type">
    <el-select v-if="definition.type.length > 1 && definition?.multiple" placeholder="+ Add ..."
    >
      <el-option v-for="t of definition?.type" :label="t" :value="t"
                 class="w-auto"
                 @click="newItem({type: t})"
                 v-show="data.showNewItem !== t">
        <i class="fa-solid fa-plus"></i>&nbsp;{{ t }}
      </el-option>
    </el-select>

    <div v-for="t of definition?.type">
      <el-button v-if="definition.type.length <= 1 && definition?.multiple" type="default"
                 v-show="data.showNewItem !== t"
                 @click="newItem({type: t})"><i class="fa-solid fa-plus"></i>&nbsp;{{ t }}
      </el-button>
      <div class="p-2">
        <el-card class="box-card" v-if="data.showNewItem === t">
          <template #header>
            <div class="card-header">
                    <span class="text-2xl"><el-button :link="false" @click="()=>data.showNewItem = ''"><i
                        class="fa-solid fa-close text-pink-600"></i></el-button> Add {{ t }}</span>
            </div>
          </template>
          <el-row class="row-bg mb-2">
            <p>Lookup an existing {{ t }} or create a new one</p>
          </el-row>
          <el-row class="row-bg mb-2">
            <el-autocomplete
                v-model="autoCompleteState[t]"
                :fetch-suggestions="queryByType(t)"
                popper-class="my-autocomplete"
                placeholder="Lookup in Crate"
                @select="handleSelect"
                class="inline-input w-full"
            >
              <template #default="{ item }">
                <div v-if="item.name" class="value">{{ item?.name[0] }}</div>
                <div v-else class="value">item?.["rdfs:label"][0]</div>
              </template>
            </el-autocomplete>
            <el-autocomplete v-if="data.canLookup"
                             v-model="data.lookupState"
                             :trigger-on-focus="false"
                             :fetch-suggestions="lookupQuery"
                             clearable
                             class="inline-input w-full"
                             placeholder="Lookup Externally"
                             @select="handleSelect">
              <template #default="{ item }">
                <div class="value">{{ item.name }}</div>
                <span class="font-bold">{{ item['@id'] }}</span>
              </template>
            </el-autocomplete>
          </el-row>
          <el-row class="row-bg mb-2">
            <el-button @click="addItem({type: t})">Add New Item&nbsp;<i class="fa-solid fa-folder-plus"></i>
            </el-button>
          </el-row>
        </el-card>
      </div>
    </div>
  </div>
  <el-alert v-if="definition?.help" :title="definition?.help" type="info" :closable="false"/>
</template>