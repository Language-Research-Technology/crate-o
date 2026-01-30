/**
  * A wrapper component to allow testing of other components with v-model binding.
  */
<script setup>
import { ref } from 'vue';

const props = defineProps({
  component: Object,
  componentProps: {
    type: Object,
    default: {}
  }
});
//const model = defineModel();
const model = ref();
</script>

<template>
  <component :is="component" v-bind="componentProps" v-model="model"></component>    
</template>

