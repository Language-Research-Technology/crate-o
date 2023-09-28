<script setup>
//TODO: Insert code that will load the readme markdown into here as html
</script>
<template>
  <el-row :gutter="20" class="p-2">
    <el-col :span="6" :xs="0" :sm="0" :md="4" :lg="6" :xl="8">
      <div class="grid-content ep-bg-purple"/>
    </el-col>
    <el-col :span="18" :xs="24" :sm="24" :md="20" :lg="18" :xl="16">
      <div class="grid gap-6">
        <h2 class="mb-3 text-lg text-gray-500 md:text-xl dark:text-gray-400"># How to use this tool?</h2>
        <h4 class="text-gray-500 dark:text-gray-400">
          📂 Open Directory
        </h4>
        <p class="text-gray-500 dark:text-gray-400">
          Select a directory/folder to describe your research
        </p>
        <h4 class="text-gray-500 dark:text-gray-400">
          🗃️ Load Files
        </h4>
        <p class="text-gray-500 dark:text-gray-400">
          Loads files from the selected directory into this crate
        </p>
        <h4 class="text-gray-500 dark:text-gray-400">
          🗄️ Bulk Add
        </h4>
        <p class="text-gray-500 dark:text-gray-400">
          Select a spreadsheet from a different directory to assist you with metadata description. This will append to
          your existing crate if there is already one created.
        </p>
        <h4 class="text-gray-500 dark:text-gray-400">
          💾 Save
        </h4>
        <p class="text-gray-500 dark:text-gray-400">
          Save the state of this page into your crate. This will create an ro-crate-metadata.json or append data into an
          existing ro-crate-metadata.json
        </p>
        <h4 class="text-gray-500 dark:text-gray-400">
          ⓧ Close
        </h4>
        <p class="text-gray-500 dark:text-gray-400">
          Closes without saving
        </p>
        <h4 class="text-gray-500 dark:text-gray-400">
          Profile
        </h4>
        <p class="text-gray-500 dark:text-gray-400">
          Select a predefined profile or load one from your computer
        </p>
      </div>
    </el-col>
  </el-row>

</template>