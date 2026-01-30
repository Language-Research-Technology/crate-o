<script setup>
import { ref, computed, inject } from 'vue';
import { ElButton, ElIcon, ElTag, ElDialog } from 'element-plus';
import { Edit } from '@element-plus/icons-vue';
//import { useRouter, useRoute } from 'vue-router';
//const $router = useRouter();
import { $state } from './keys';
const state = inject($state);

const props = defineProps({
  modelValue: [Object],
  icon: {
    type: [String, Object],
    default: ''
  }
});

const emit = defineEmits({
  /** Triggered when the link is clicked and the entity exists */
  'entity': null,
});
//const emit = defineEmits(['show']);
//const id = computed(() => props.modelValue['@id']);
const label = computed(() => props.modelValue['name']?.['0'] || props.modelValue['@id']);
const dialogVisible = ref(false);

function showEntity() {
  const id = props.modelValue['@id'];
  if (props.modelValue['@type']) {
    //$router.push({query: {id: encodeURIComponent(id)}});
    state.showEntity(id);
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
  <el-button class="link-entity" color="#626aef" type="primary" plain @click="showEntity" :title="modelValue['@id']">
    <el-icon v-if="icon">
      <component :is="icon"></component>
    </el-icon>
    <span class="flex mr-2">
      <!-- <el-tag class="mr-1 font-bold" size="small" plain type="info" v-for="t of modelValue['@type']">{{ t }}</el-tag> -->
      <template v-for="t of modelValue['@type']">
        <span class="type-tag" v-if="t">{{ t }}</span>
      </template>
    </span>
    <slot> {{ label }} </slot>
  </el-button>
  <el-dialog v-model="dialogVisible" :title="label" width="50%">
    <span>No entity with identifier
      <pre>{{ modelValue['@id'] }}</pre> found in this crate. Please select from the following options:
    </span>
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

<style>
.el-button.link-entity {
  height: fit-content;
  min-height: 32px;
}

.el-button.link-entity>span {
  flex-wrap: wrap;
  row-gap: 0.5em;
  white-space: normal;
  text-align: left;
}

.type-tag {
  margin-right: 0.25rem;
  font-weight: 600;
  background: #8295fb;
  padding: 0.25rem;
  border-radius: 3px;
  /* border: 1px solid var(--el-button-border-color); */
  font-size: 75%;
  color: white;
}
</style>