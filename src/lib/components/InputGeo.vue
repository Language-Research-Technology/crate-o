<script setup>
import { reactive, onMounted, watchEffect, computed, isProxy, watch } from "vue";
import { ElRow, ElCol, ElForm, ElFormItem, ElCollapse, ElCollapseItem } from 'element-plus';

import InputText from '../components/InputText.vue';
import LeafletMap from '../components/LeafletMap.vue';
//import { fromEntity, updateEntity } from './geo';
import transformer from './geo';

const props = defineProps({
  modelValue: null
});
const emit = defineEmits(['update:modelValue']);
const data = reactive({
  geoEntity: null,
  wkt: null
});
//onMounted(() => console.log(props));
// const entity = computed({
//   get() { return props.modelValue; },
//   set(vals) { emit('update:modelValue', vals); }
// });
watchEffect(() => {
  if (props.modelValue['@id']) {
    data.geoEntity = props.modelValue;
  } else {
    data.wkt = props.modelValue;
  }
});

function updateValue(v, k, i) {
  console.log(v, k, i);
  if (k == null) {
    data.geoEntity = v;
  } else if (i == null) {
    data.geoEntity[k] = v;
  } else {
    data.geoEntity[k][i] = v;
    //props.modelValue[k] = props.modelValue[k];
  }
  console.log(data.geoEntity.asWKT);
  emit('update:modelValue', data.geoEntity);
  console.log(props.modelValue);
  //data.geoEntity = props.modelValue;
}

function update(v) {
  emit('update:modelValue', v);
  data.wkt = props.modelValue;
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
    <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="14">
      <LeafletMap class="h-72 flex grow min-w-[200px] mr-4" :modelValue="data.geoEntity"
        @update:modelValue="updateValue" :transformer="transformer"></LeafletMap>
      <div class="text-xs italic">* This map is not suitable for native title or other land claims.</div>
    </el-col>
    <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="10">
      <el-collapse v-if="data.geoEntity">
        <el-collapse-item title="Entity Details" name="1">
          <el-form label-width="auto">
            <el-form-item label="@id">
              <InputText :modelValue="data.geoEntity['@id']" @update:modelValue="v => updateValue(v, '@id')" />
            </el-form-item>
            <el-form-item label="@type">
              <InputText v-for="v of data.geoEntity['@type']" :modelValue="v" class="flex-row flex-nowrap" disabled />
            </el-form-item>
            <template v-for="(vals, k) in data.geoEntity">
              <el-form-item v-if="!(k in { '@id': 0, '@type': 0 })" :label="k">
                <InputText v-for="(v, i) of vals" :modelValue="vals[i]" @update:modelValue="v => updateValue(v, k, i)"
                  class="flex-row flex-nowrap" />
              </el-form-item>
            </template>
          </el-form>
        </el-collapse-item>
      </el-collapse>
      <InputText v-else :model-value="data.wkt" @update:model-value="update" />
    </el-col>
  </el-row>
</template>

<style>
.el-form-item .el-form-item {
  margin-bottom: 0.5rem;
}
</style>