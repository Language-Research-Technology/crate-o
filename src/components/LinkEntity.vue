<script setup>
import { ref, computed } from 'vue';
import { Edit } from '@element-plus/icons-vue';
import { DataStore } from '../stores/data';
import { useRouter, useRoute } from 'vue-router';

const props = defineProps({
  modelValue: [Object],
  icon: {
    type: [String, Object],
    default: Edit
  }
});

//const emit = defineEmits(['route']);
//const id = computed(() => props.modelValue['@id']);
const label = computed(() => props.modelValue['name']?.['0'] || props.modelValue['@id']);
const dialogVisible = ref(false);

function showEntity() {
  const id = props.modelValue['@id'];
  const e = DataStore.crate?.getEntity(id);
  if (e) {
    //useRouter().push({query: {id: encodeURIComponent(id)}});
    window.data.entity = e;
  } else {
    dialogVisible.value = true;
  }
}

function openUrl() {
  dialogVisible.value = false;
  window.open(props.modelValue['@id'], '_blank');//.focus();
}
</script>

<template>
  <el-button color="#626aef" type="primary" plain :icon="icon" @click="showEntity" :title="modelValue['@id']">
    <el-tag size="small" type="info" v-for="type of modelValue['@type']">{{ type }}</el-tag>
    <slot> {{ label }} </slot>
    <!-- <el-icon class="el-icon--right">
        <Edit />
      </el-icon> -->
  </el-button>
  <el-dialog v-model="dialogVisible" :title="label" width="50%">
    <span>No entity found in this crate referenced by id {{ }}. Please select from the following options:</span>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button @click="dialogVisible = false">
          Create new entity
        </el-button>
        <el-button type="primary" @click="openUrl">
          Open as external link
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

    