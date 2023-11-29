<script setup>

import { ref, watch, computed } from 'vue';
import { ElInput } from 'element-plus';

const props = defineProps({
  modelValue: [String, Number],
  type: {
    type: String,
    default: 'text',
    required: false,
    /**
     * @param {string} value 
     */
    validator(value) { return (value in { textarea: 0, text: 0, number: 0, email: 0, password: 0, search: 0, tel: 0, url: 0 }); }
  }
});
const emit = defineEmits(['update:modelValue']);

const value = ref();
const input = ref(null);
const isValid = computed(() => input.value?.input?.validity?.valid ?? true);

watch(() => props.modelValue, (val) => {
  value.value = val;
}, { immediate: true });

function onChange(newValue) {
  if (isValid.value) {
    emit('update:modelValue', newValue);
  }
}
</script>


<template>
  <el-input class="flex-grow" ref="input" :class="{ 'is-error': !isValid }" :show-password="props.type === 'password'"
    v-model="value" :type="type" :autosize="{ minRows: 1, maxRows: 6 }" :required="props.required" @change="onChange">
  </el-input>
  <!--input :value="modelValue" @input="$emit('update:modelValue', $event.target.value)"/-->
</template>

<style></style>