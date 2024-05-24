<script setup>
import { ElRow, ElCol } from 'element-plus';

</script>
<template>
  <div class="grid gap-2 info-toolbar text-gray-500 dark:text-gray-400">
    <h2 class="mb-3 text-lg md:text-xl">Main Menu</h2>
    <p>From the main menu, the following actions are available:</p>
    <h4>📂 Open Directory</h4>
    <p>Select a directory/folder to describe your research.</p>
    <h4>🗃️ Load Files</h4>
    <p>Loads files from the selected directory into this RO-Crate.</p>
    <h4>🗄️ Bulk Add</h4>
    <p>Select a spreadsheet from a different directory to assist you with metadata description.
      This will append to your existing RO-Crate if there is already one created.
    </p>
    <h4>💾 Save</h4>
    <p>Save the state of this page into your RO-Crate.
      This will create an <i>ro-crate-metadata.json</i> file or append data into an existing
      <i>ro-crate-metadata.json</i>.
    </p>
    <h4>ⓧ Close</h4>
    <p>Closes without saving.</p>
    <h4>Mode</h4>
    <p>Select a predefined mode or load one from your computer.</p>
    <p></p><br/>
    <h2 class="mb-3 text-lg md:text-xl">General Navigation</h2>
    <ul class="list-disc list-outside pl-5">
      <li><strong>Selected Directory</strong> shows the directory or folder you currently have open.</li>
      <li>Below <strong>Selected Directory</strong>, you will see a home icon followed by a file path that indicates
        where you are located in the collection levels. This will change as you navigate to different sublevels.</li>
      <li>Depending on the metadata group, different types of metadata will be available:
        <ul class="list-disc list-outside pl-5">
          <li><strong>About</strong> - The core metadata for this RO-Crate and its subject matter.</li>
          <li><strong>Related People, Orgs & Works</strong> - The context for the creation of this RO-Crate; who made it, funded it etc.</li>
          <li><strong>Structure</strong> - How the parts of this RO-Crate relate, such as collection and object relationships.</li>
          <li><strong>Provenance</strong> - Detailed description of how entities were created, by whom and with which tools.</li>
          <li><strong>Space & Time</strong> - Where and when the data was collected; the times and places it mentions or describes.</li>
          <li><strong>Software & Hardware</strong> - For computer programs and execution environments that could be used to create data, have created data, or are being packaged and described.</li>
          <li><strong>Others</strong> - Other properties not in the above categories. Note that if you find a property in `Other` that should be in one of the above groups or have other suggestions, please raise an issue on [GitHub](https://github.com/Language-Research-Technology/crate-o).</li>
        </ul>
      </li>
    </ul>
    <p>On the right-hand panel, there are some further options related to navigating and creating metadata entities:</p>
    <ul class="list-disc list-outside pl-5">
      <li><strong>Create New Entity</strong>: Create a new metadata entity, such as a
        provenance action such as CreateAction, which describes how a work is created with more precision than a
        property like `author`.</li>
      <li><strong>Links from</strong>: When located in a sub-group, select to view the parent group(s).</li>
      <li><strong>All Entities</strong>: Select to view all metadata associated with your collection.</li>
      <li><strong>Unlinked Entities</strong>: Select to view all metadata that currently is not linked to any
        properties.</li>
    </ul>
  </div>

</template>

<style>
.info-toolbar h4 {
  font-weight: bold;
  margin-top: 0.5rem;
}
</style>