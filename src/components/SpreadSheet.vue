<script setup>

import {Workbook} from 'ro-crate-excel';
import {ROCrate} from "ro-crate";
import {reactive, watch, inject} from "vue";

const props = defineProps(['buffer', 'crate']);
const emit = defineEmits(['update:crate']);

const data = reactive({
  dialogVisible: false,
  log: [],
  wb: {},
  crate: null
})

watch(() => props.buffer, (buffer) => {
  console.log('watch profile');
  data.log = [];
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
      data.log.push('Log:');
      data.log = data.log.concat(wb.log);
      data.crate = wb.crate.toJSON();
      console.log(data.crate)
    } catch (e) {
      data.dialogVisible = true;
      data.log.push('ERROR:');
      data.log.push(e);
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
      <el-row v-for="log of data.log">
        <p class="w-full">{{ log }}</p>
      </el-row>
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