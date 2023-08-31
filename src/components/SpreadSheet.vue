<script setup>

import {Workbook} from 'ro-crate-excel';
import {ROCrate} from "ro-crate";
import {reactive, watch, inject} from "vue";

const props = defineProps(['buffer', 'crate']);
const emit = defineEmits(['update:crate']);

const data = reactive({
  dialogVisible: false,
  log: {
    info: [],
    warning: [],
    error: []
  },
  wb: {},
  crate: null
})

watch(() => props.buffer, (buffer) => {
  console.log('watch profile');
  data.log = {
    info: [],
    warning: [],
    error: []
  };
  data.crate = null;
  loadSheet(buffer);
}, {immediate: true});

async function loadSheet(buffer) {
  if (buffer) {

    const crate = new ROCrate(props.crate, {array: true, link: true});
    try {
      const wb = new Workbook({crate});
      await wb.loadExcelFromBuffer(buffer, true);
      data.dialogVisible = true;
      data.log.info = wb.log.info;
      data.log.warning = wb.log.warning;
      data.crate = wb.crate.toJSON();
      console.log(data.crate)
    } catch (e) {
      data.dialogVisible = true;
      data.log.error.push(e);
    }
  }
}

function updateCrate() {
  emit('update:crate', data.crate);
  data.dialogVisible = false;
}

</script>
<template>
  <el-dialog
      v-model="data.dialogVisible"
      title="Loading Metadata"
      width="50%"
      :before-close="data.handleClose"
  >
    <div class="overflow-x-scroll h-96">
      <p class="p-2">This metadata will be added to your crate, click 'Confirm' to continue</p>
      <el-collapse accordion>
        <el-collapse-item v-if="data.log.error.length > 0" title="Errors" name="1">
          <el-row v-for="log of data.log.error">
            <p class="w-full">{{ log }}</p>
          </el-row>
        </el-collapse-item>
        <el-collapse-item title="Warnings" name="2">
          <el-row v-for="log of data.log.warning">
            <p class="w-full">{{ log }}</p>
          </el-row>
        </el-collapse-item>
        <el-collapse-item title="Info" name="3">
          <el-row v-for="log of data.log.info">
            <p class="w-full">{{ log }}</p>
          </el-row>
        </el-collapse-item>
      </el-collapse>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="data.dialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="updateCrate">
          Confirm
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>