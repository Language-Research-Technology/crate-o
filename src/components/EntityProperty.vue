<script setup>
import {onMounted, onUpdated, reactive, toRaw} from "vue";
import EntityInput from "@/components/EntityInput.vue";
import {find} from 'lodash';
import AddEntity from "@/components/AddEntity.vue";

const props = defineProps(['id', 'value', 'property', 'index', 'definition']);
const pageSize = 10; //Later do in conf the page size
const data = reactive({
  newValue: props.value,
  showNewItem: false,
  deletable: true,
  page: props.value.slice(0, pageSize),
  currentPage: 1,
  filter: undefined,
  filteredValues: props.value
});

const emit = defineEmits(['updateEntity', 'loadEntity', 'addItem', 'deleteEntity']);

function loadEntity(id) {
  emit('loadEntity', id);
}

function updateValue(i, event) {
  data.newValue[i] = event.target.value;
  emit('updateEntity', {property: props.property, value: data.newValue})
}

function removeValue({index}) {
  data.newValue.splice(index, 1);
  emit('updateEntity', {property: props.property, value: data.newValue});
}

function addProperty() {
  data.newValue.push('');
  emit('updateEntity', {property: props.property, value: data.newValue});
}

function addItem({type}) {
  emit('addItem', {reference: props.id, type, property: props.property});
}

function linkItem({item}) {
  data.newValue.push(item);
  emit('updateEntity', {property: props.property, value: data.newValue});
}

function updatePages(page) {
  data.page = data.filteredValues.slice((page - 1) * 10, (page - 1) * 10 + 10);
}

function filterValues() {
  data.filteredValues = props.value.filter((v) => {
      return v.name?.[0].match(new RegExp(data.filter, "i"));
  });
  updatePages(1);
}

</script>
<template>
  <el-form-item :label="property" class="w-full">
    <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="py-1">
      <el-pagination v-if="data.filteredValues.length > pageSize"
                     v-model:currentPage="data.currentPage"
                     layout="prev, pager, next"
                     :total="data.filteredValues.length"
                     @current-change="updatePages"
      />
      <el-input
          v-model="data.filter"
          placeholder="Look up entity"
          clearable
          @input="filterValues"
      />
      <entity-input v-if="Array.isArray(value)"
                    v-for="(v, i) of data.page"
                    :index="i"
                    :name="property + '_' + i"
                    :value="v"
                    :id="id"
                    @change="updateValue(i, $event)"
                    @new-entity="loadEntity"
                    @remove-value="removeValue({index: i})"
                    :property="property" :deletable="value.length > 1"
                    :definition="definition"/>
      <entity-input v-else
                    :index="index"
                    :name="property + '_' + index"
                    :value="value"
                    :id="id"
                    @change="$emit('updateEntity', {property, value: $event.target.value})"
                    @new-entity="loadEntity"
                    :property="property" :deletable="false"
                    :definition="definition"/>
      <add-entity :definition="definition" :property="property" :id="id"
                  @link-item="linkItem" @add-item="addItem" @add-property="addProperty()"/>
    </el-col>
  </el-form-item>
</template>