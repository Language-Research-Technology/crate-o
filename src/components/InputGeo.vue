<script setup>
import { reactive, onMounted, watchEffect, computed, isReactive } from "vue";
import LeafletMap from '../components/LeafletMap.vue';
import { fromEntity, updateEntity } from './geo';

const props = defineProps({
  modelValue: null
});
const emit = defineEmits(['update:modelValue']);

onMounted(() => console.log(props));

const data = reactive({
  entity: null
});

watchEffect(() => {
  console.log(props.modelValue);
  data.entity = props.modelValue.toJSON();
});

const shapes = computed({
  get() { return fromEntity(props.modelValue); },
  set(vals) {
    //const entity = props.modelValue.toJSON();
    emit('update:modelValue', updateEntity(props.modelValue, vals));
    data.entity = props.modelValue.toJSON();
  }
});

function onChange(k) {
  props.modelValue[k] = data.entity[k];
  emit('update:modelValue', data.entity);
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
  <LeafletMap v-model="shapes"></LeafletMap>
  <!-- <el-form-item v-if="data.current >= 0" :label="data.shapes[data.current][0]">
    <el-input v-model="data.shapes[data.current][1]" placeholder="Coordinates" />
  </el-form-item> -->
  <div class="flex flex-col w-80">
    <el-form-item v-for="(vals, k) in data.entity" :label="k">
      <el-input v-if="Array.isArray(vals)" v-for="(v,i) of vals" v-model="vals[i]" @change="v => onChange(k)"/>
      <el-input v-else v-model="data.entity[k]" @change="v => onChange(k)"/>
    </el-form-item>
    <!-- <el-form-item v-for="(vals, k) in modelValue" :label="k">
      <el-input v-if="Array.isArray(vals)" v-for="(v,i) of vals" v-model="vals[i]" class="test"/>
      <el-input v-else v-model="modelValue[k]" />
    </el-form-item> -->
    <!-- <el-form-item v-for="(v, k) in modelValue" :label="k">
      <el-input v-model="modelValue[k]" />
    </el-form-item> -->
  </div>
</template>
