<script setup>

import { ref, watch, computed } from 'vue';

const props = defineProps({
  modelValue: [String, Number],
  type: {
    type: String,
    default: 'text',
    /**
     * @param {string} value 
     */
    validator(value) { return (value in { textarea: 0, text: 0, number: 0, email: 0, password: 0, search: 0, tel: 0, url: 0 }); }
  }
});
const emit = defineEmits(['update:modelValue']);

const value = ref('' + props.modelValue);
const input = ref(null);
const isError = ref(false);

watch(() => props.modelValue, (val) => {
  value.value = typeof val === 'string' ? ('' + val) : '';
}, { immediate: true });

function onInput(newValue) {
  value.value = newValue;
  var nativeInput = input.value.input;
  if (newValue && nativeInput && !nativeInput.validity.valid) {
    isError.value = true;
  } else {
    isError.value = false;
    if (props.type === 'number') newValue = +newValue;
  }
}
function onChange(newValue) {
  if (!isError.value) {
    emit('update:modelValue', newValue);
  }
}
</script>


<template>
  <el-input class="flex-grow" ref="input" :class="{ 'is-error': isError }" :show-password="props.type === 'password'"
    :modelValue="value" :type="type" :autosize="{ minRows: 1, maxRows: 6 }" @input="onInput" @change="onChange">
  </el-input>
  <!--input :value="modelValue" @input="$emit('update:modelValue', $event.target.value)"/-->
</template>

<style></style>