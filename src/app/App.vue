<script setup>
import { RouterLink, RouterView } from 'vue-router';
import { ElRow, ElCol, ElDialog, ElButton } from 'element-plus';

import { reactive } from "vue";

const version = __APP_VERSION__;
const data = reactive({
  noBrowserSupport: false
});

if (!window.showDirectoryPicker) {
  data.noBrowserSupport = true;
}

</script>

<template>
  <header class="flex space-x-2 content-center items-center">
    <el-row :gutter="10" class="flex items-center justify-center min-w-md">
      <el-col :span="8">
        <span class="flex flex-col justify-center items-center ml-2">
          <img alt="Crate-O an RO-Crate Editor" class="logo min-h-full p-0" src="/logo.svg" width="60" />
        </span>
      </el-col>
      <el-col :span="16">
        <div class="justify-center text-2xl">Crate-O
          <span class="text-xs">v{{ version }}</span>
        </div>
      </el-col>
    </el-row>
    <!-- <nav>
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/about">About</RouterLink>
      <RouterLink to="/describo">Describo</RouterLink>
    </nav> -->
  </header>
  <RouterView />

  <el-dialog v-model="data.noBrowserSupport" title="Browser Not Supported" width="50%">
    <el-row class="p-2">
      This browser is not supported, please use the latest version of:
    </el-row>
    <el-row class="p-2">
      <p>
        <a target="_blank" class="font-bold" href="https://www.google.com/chrome/">Google Chrome</a>
      </p>
    </el-row>
    <el-row class="p-2">
      <p>
        <a target="_blank" class="font-bold" href="https://www.microsoft.com/edge/">Microsoft Edge</a>
      </p>
    </el-row>
    <el-row class="p-2">
      <p>
        You can continue to view the page in this browser, however Crate-O will not work.
      </p>
    </el-row>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="data.noBrowserSupport = false">Cancel</el-button>
        <el-button type="primary" @click="data.noBrowserSupport = false">
          OK
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

