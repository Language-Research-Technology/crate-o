<script setup>
import { ElRow, ElCol } from 'element-plus';

</script>
<template>
  <div class="grid gap-2 info-toolbar">
    <h2 class="mb-3 text-lg text-gray-500 md:text-xl dark:text-gray-400">Toolbar Options</h2>
    <h4 class="text-gray-500 dark:text-gray-400">
      📂 Open Directory
    </h4>
    <p class="text-gray-500 dark:text-gray-400">
      Select a directory/folder to describe your research.
    </p>
    <h4 class="text-gray-500 dark:text-gray-400">
      🗃️ Load Files
    </h4>
    <p class="text-gray-500 dark:text-gray-400">
      Loads files from the selected directory into this RO-Crate.
    </p>
    <h4 class="text-gray-500 dark:text-gray-400">
      🗄️ Bulk Add
    </h4>
    <p class="text-gray-500 dark:text-gray-400">
      Select a spreadsheet from a different directory to assist you with metadata description.
      This will append to your existing RO-Crate if there is already one created.
    </p>
    <h4 class="text-gray-500 dark:text-gray-400">
      💾 Save
    </h4>
    <p class="text-gray-500 dark:text-gray-400">
      Save the state of this page into your RO-Crate.
      This will create an <i>ro-crate-metadata.json</i> file or append data into an existing <i>ro-crate-metadata.json</i>.
    </p>
    <h4 class="text-gray-500 dark:text-gray-400">
      ⓧ Close
    </h4>
    <p class="text-gray-500 dark:text-gray-400">
      Closes without saving.
    </p>
    <h4 class="text-gray-500 dark:text-gray-400">
      Mode
    </h4>
    <p class="text-gray-500 dark:text-gray-400">
      Select a predefined mode or load one from your computer.
    </p>
  </div>

</template>

<style>
.info-toolbar h4 {
  font-weight: bold;
  margin-top: 0.5rem;
}
</style>