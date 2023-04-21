<script setup>
import {onMounted, onUpdated, reactive, toRaw} from "vue";
import EntityInput from "@/components/EntityInput.vue";
import {find} from 'lodash';
import AddEntity from "@/components/AddEntity.vue";
const props = defineProps(['id', 'value', 'property', 'index', 'definition']);
const pageSize = 10; //Later do in conf the page size
const data = reactive({
  values: [],
  showNewItem: false,
  deletable: true,
  currentPage: 1,
  filter: undefined,
  filteredValues: [],
  pageStartIndex: 0
});
onMounted(() => {
  if (Array.isArray(props.value)) {
    data.values = props.value.map((v, i) => [i, v]);
    data.filteredValues = data.values;
  } else {
    data.values = props.value;
  }
});
onUpdated(() => {
  data.filteredValues = data.values;
  // if (Array.isArray(props.value)) {
  //   data.values = props.value.map((v, i) => [i, v[1]]);
  // }
})

const emit = defineEmits(['updateEntity', 'loadEntity', 'addItem', 'deleteEntity']);

function loadEntity(id) {
  emit('loadEntity', id);
}

function updateValue(i, event) {
  data.values[i][1] = event.target.value;
  emit('updateEntity', {property: props.property, value: data.values.map((v) => v[1])})
}

function removeValue({index}) {
  data.values.splice(index, 1);
  data.values = data.values.map((v, i) => [i, v[1]]);
  emit('updateEntity', {property: props.property, value: data.values.map((v) => v[1])});
}

function addProperty() {
  data.values.push([data.values.length, '']);
  emit('updateEntity', {property: props.property, value: data.values.map((v) => v[1])});
}

function addItem({type}) {
  emit('addItem', {reference: props.id, type, property: props.property});
  data.values = props.value.map((v, i) => [i, v[1]]);
}

function linkItem({item}) {
  data.values.push([data.values.length, item]);
  emit('updateEntity', {property: props.property, value: data.values.map((v) => v[1])});
}

function updatePages(page) {
  data.pageStartIndex = (page - 1) * 10;
}

function filterValues() {
  data.filteredValues = data.values.filter((v) => {
    return v[1].name?.[0].match(new RegExp(data.filter, "i"));
  });
  updatePages(1);
}

</script>
<template>
  <el-form-item :label="property" class="w-full">
    <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="py-1">
      <div v-if="Array.isArray(value)">
        <div v-if="data.values.length > pageSize">
          <el-pagination
              v-model:currentPage="data.currentPage"
              layout="prev, pager, next"
              :total="data.filteredValues.length"
              @current-change="updatePages"
          />
          <el-input
              v-model="data.filter"
              :placeholder="'Search in ' +  property"
              clearable
              @input="filterValues"
          />
        </div>
        <entity-input v-for="(v, i) of data.filteredValues.slice(data.pageStartIndex, data.pageStartIndex + pageSize)"
                      :key="id + '_' + v[0]"
                      :index="v[0]"
                      :name="property + '_' + v[0]"
                      :value="v[1]"
                      :id="id"
                      @change="updateValue(v[0], $event)"
                      @new-entity="loadEntity"
                      @remove-value="removeValue({index: v[0]})"
                      :property="property" :deletable="data.values.length > 1"
                      :definition="definition"/>
      </div>
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