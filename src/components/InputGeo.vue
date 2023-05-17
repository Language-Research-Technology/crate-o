<script setup>
import { onMounted } from "vue";

const props = defineProps(['modelValue', 'onUpdate']);
const emit = defineEmits(['update:modelValue']);

onMounted(() => console.log(props));

function onInput(value) {
  //console.log(this.$event);
  console.log(value);
  //emit('update', value);
  emit('update:modelValue', value);
// && $emit('update:modelValue', $event.target.value)
}
</script>

<template>
<el-input :modelValue="modelValue" @input="onInput">
</el-input>
<!--input :value="modelValue" @input="$emit('update:modelValue', $event.target.value)"/-->
</template>

    