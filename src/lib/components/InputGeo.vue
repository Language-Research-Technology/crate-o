<script setup>
//import { reactive, onMounted, watchEffect, computed, isReactive, isProxy, watch } from "vue";
import { ElRow, ElCol, ElForm, ElFormItem } from 'element-plus';

import InputText from '../components/InputText.vue';
import LeafletMap from '../components/LeafletMap.vue';
//import { fromEntity, updateEntity } from './geo';
import transformer from './geo';

const props = defineProps({
  modelValue: null
});
const emit = defineEmits(['update:modelValue']);
//onMounted(() => console.log(props));
// const entity = computed({
//   get() { return props.modelValue; },
//   set(vals) { emit('update:modelValue', vals); }
// });

function updateValue(v, k, i) {
  console.log(v, k, i);
  if (i == null) {
    props.modelValue[k] = v;
  } else {
    props.modelValue[k][i] = v;
    props.modelValue[k] = props.modelValue[k];
  }
  emit('update:modelValue', props.modelValue);
}


const help = {
  point: 'Latitude and Longitude separated by space',
  line: 'Sequence of Latitude and Longitude separated by space',
  box: 'Sequence of Latitude and Longitude separated by space',
  circle: 'Latitude and Longitude separated by space, followed by space and radius in meter',
  polygon: 'Sequence of Latitude and Longitude separated by space'

};
</script>

<template>
  <el-row :gutter="10" class="grow">
    <el-col :xs="24" :sm="24" :md="14" :lg="14" :xl="14">
      <LeafletMap class="h-72 flex grow min-w-[200px] mr-4" :modelValue="modelValue"
        @update:modelValue="(v) => $emit('update:modelValue', v)" :transformer="transformer"></LeafletMap>
    </el-col>
    <el-col :xs="24" :sm="24" :md="10" :lg="10" :xl="10">
      <el-form label-width="auto">
        <el-form-item label="@id">
          <InputText :modelValue="modelValue['@id']" @change="v => updateValue(v, '@id')" />
        </el-form-item>
        <el-form-item label="@type">
          <InputText v-for="v of modelValue['@type']" :modelValue="v" class="flex-row flex-nowrap" disabled />
        </el-form-item>
        <template v-for="(vals, k) in modelValue">
          <el-form-item v-if="!(k in { '@id': 0, '@type': 0 })" :label="k">
            <InputText v-for="(v, i) of vals" :modelValue="vals[i]" @change="v => updateValue(v, k, i)"
              class="flex-row flex-nowrap" />
          </el-form-item>
        </template>
      </el-form>
    </el-col>
  </el-row>
</template>

<style>
.el-form-item .el-form-item {
  margin-bottom: 0.5rem;
}
</style>