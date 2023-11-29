<script setup>
import { computed } from "vue";
import { ElSelectV2 } from 'element-plus';

const props = defineProps({
  modelValue: { type: [String, Object] },
  options: { type: Array, default: [] },
  allowCreate: { type: Boolean },
});

const emit = defineEmits(['update:modelValue']);

const value = computed(() => props.modelValue?.['@id'] || props.modelValue);
const values = computed(() => props.options.map(o => (typeof o === 'string') ? { value: o, label: o } : { value: o['@id'], label: o.name || o['@id'] }));
function onChange(newValue) {
  var v = props.options.find(o => o['@id'] && o['@id'] === newValue) || newValue;
  emit('update:modelValue', v);
  // && $emit('update:modelValue', $event.target.value)
}
</script>

<template>
  <el-select-v2  class="flex-grow" filterable :allow-create="allowCreate"
  :model-value="value" :options="values" @change="onChange"></el-select-v2>
  <!--input :value="modelValue" @input="$emit('update:modelValue', $event.target.value)"/-->
</template>

