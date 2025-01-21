<script setup>

import { Workbook } from 'ro-crate-excel';
import { ROCrate } from "ro-crate";
import { reactive, watch, ref } from "vue";
import { ElRow, ElCol, ElDialog, ElCollapse, ElCollapseItem, ElButton } from 'element-plus';
import { useRouter } from 'vue-router';

const router = useRouter();
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
  crate: null,
  loading: false
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
}, { immediate: true });

async function loadSheet(buffer) {
  if (buffer) {
    data.loading = true;
    data.dialogVisible = true;
    const crate = new ROCrate(props.crate, { array: true, link: true });
    try {
      const wb = new Workbook({ crate });
      await wb.loadExcelFromBuffer(buffer, true);
      data.log.info = wb.log.info;
      data.log.warning = wb.log.warning;
      data.crate = wb.crate.toJSON();
      scrollTopDialog();
      data.loading = false;
    } catch (e) {
      data.log.error.push(e);
      scrollTopDialog();
      data.loading = false;
    }
  }
}

function scrollTopDialog() {
  setTimeout(function () {
    document.getElementById('spreadsheetDialogTop').scrollIntoView({ behavior: 'smooth' });
  }, 100);
}

function updateCrate() {
  emit('update:crate', data.crate);
  router.push({path: "/"}); // in case you updated the root id!
  data.dialogVisible = false;
}

const activeLog = ref(['1', '2']);
const changeActiveLog = (val) => {
  activeLog.value = val;
}

function toggleElements() {
  if (activeLog.value.length) {
    activeLog.value = [];
  } else {
    activeLog.value = ['1', '2', '3'];
  }
}

</script>
<template>
  <el-dialog v-model="data.dialogVisible" title="Loading Metadata" width="50%" :before-close="data.handleClose">
    <div class="overflow-x-scroll h-96" v-loading="data.loading">
      <span id="spreadsheetDialogTop"></span>
      <p class="p-2" v-if="data.log.info.length > 0">These metadata fields will be added to your crate, click 'Confirm'
        to continue</p>
      <p class="p-2" v-if="data.log.info.length == 0 && !data.loading">No metadata could be added, please check your
        spreadsheet</p>
      <el-collapse v-model="activeLog" @change="changeActiveLog">
        <el-collapse-item v-if="data.log.error.length > 0" title="Errors" name="1">
          <el-row v-for="log of data.log.error">
            <p class="w-full">{{ log }}</p>
          </el-row>
        </el-collapse-item>
        <el-collapse-item v-if="data.log.warning.length > 0" title="Warnings" name="2">
          <el-row v-for="log of data.log.warning">
            <p class="w-full">{{ log }}</p>
          </el-row>
        </el-collapse-item>
        <el-collapse-item v-if="data.log.info.length > 0" title="Info" name="3">
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