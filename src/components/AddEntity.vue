<script setup>
import {reactive, ref, onMounted, inject, onUpdated} from "vue";
import EntityInput from "@/components/EntityInput.vue";

const search = inject('dataService');

const props = defineProps(['definitions', 'property', 'id']);
const data = reactive({
  showNewItem: false
});
const emit = defineEmits(['addItem', 'linkItem', 'addProperty']);
const entities = ref([])
const autoCompleteState = ref({});
let currentType;

function newItem({type}) {
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
  console.log(item)
  emit('linkItem', {item})
}

function handleIconClick() {

}

</script>
<template>
  <div v-for="definition in definitions">
    <div v-if="definition?.type">
      <div v-for="t of definition?.type">
        <el-button type="default" v-if="definition?.multiple" v-show="data.showNewItem !== t"
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
                  placeholder="Please input"
                  @select="handleSelect"
                  class="inline-input w-full"
              >
                <template #default="{ item }">
                  <div class="value">{{ item.name[0] }}</div>
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
  </div>
</template>