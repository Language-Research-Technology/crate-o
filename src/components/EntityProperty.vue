<script setup>
import {onMounted, onUpdated, reactive, toRaw} from "vue";
import EntityInput from "@/components/EntityInput.vue";
import {find} from 'lodash';
import AddEntity from "@/components/AddEntity.vue";

const props = defineProps(['id', 'value', 'property', 'index', 'definitions']);
const data = reactive({
  newValue: props.value,
  showNewItem: false,
  deletable: true
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

</script>
<template>
  <el-form-item :label="property" class="w-full">
    <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="py-1">
      <entity-input v-if="Array.isArray(value)"
                    v-for="(v,i) of value"
                    :index="i"
                    :name="property + '_' + i"
                    :value="v"
                    :id="id"
                    @change="updateValue(i, $event)"
                    @new-entity="loadEntity"
                    @remove-value="removeValue({index: i})"
                    :property="property" :deletable="value.length > 1"/>
      <entity-input v-else
                    :index="index"
                    :name="property + '_' + index"
                    :value="value"
                    :id="id"
                    @change="$emit('updateEntity', {property, value: $event.target.value})"
                    @new-entity="loadEntity"
                    :property="property" :deletable="false"/>
      <add-entity :definitions="definitions" :property="property" :id="id"
                  @link-item="linkItem" @add-item="addItem" @add-property="addProperty()"/>
    </el-col>
  </el-form-item>
</template>