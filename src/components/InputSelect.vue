<script setup>
import { ref, reactive, watch, computed } from "vue";

const props = defineProps(['modelValue', 'options']);
const emit = defineEmits(['update:modelValue']);

const value = computed(() => props.modelValue?.['@id'] || props.modelValue);
const values = computed(() => props.options.map(o => (typeof o === 'string') ? { value: o, label: o } : { value: o['@id'], label: o.name }));
function onChange(newValue) {
  var v = props.options.find(o => o['@id'] && o['@id'] === newValue) || newValue;
  emit('update:modelValue', v);
  // && $emit('update:modelValue', $event.target.value)
}
</script>

<template>
  <el-select-v2  class="flex-grow" filterable clearable :modelValue="value" :options="values" @change="onChange"></el-select-v2>
  <!--input :value="modelValue" @input="$emit('update:modelValue', $event.target.value)"/-->
</template>

