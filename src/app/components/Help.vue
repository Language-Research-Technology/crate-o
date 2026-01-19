<script setup>
import { ElRow, ElCol } from 'element-plus';

</script>
<template>
  <div class="grid gap-2 info-toolbar text-gray-500 dark:text-gray-500">
    <h2 class="mb-3 text-lg md:text-xl">Main Menu</h2>
    <p>From the main menu, the following actions are available:</p>
    <p><strong>📂 Open Directory</strong> - Select a directory/folder to describe your research.</p>
    <p><strong>🗃️ Load Files</strong> - Load files from the selected directory into this RO-Crate.</p>
    <p><strong>🗄️ Bulk Add</strong> - Select a spreadsheet from a different directory to assist you with metadata
      description.
      This will append to your existing RO-Crate if there is already one created.
    </p>
    <p><strong>💾 Save</strong> - Save the state of this page into your RO-Crate.
      This will create an <i>ro-crate-metadata.json</i> file or append data into an existing
      <i>ro-crate-metadata.json</i>.
    </p>
    <p><strong>⚙️ Settings</strong> - Change local settings</p>
    <ul class="pl-4"><li>Choose between different preview generators for the RO-Crate HTML preview.</li></ul>
    <p><strong>❌ Close</strong> - Close the current session without saving.</p>
    <p><strong>❓ Help</strong> - Display general help from anywhere in Crate-O.</p>
    <p><strong>🛈 About</strong> - Display general information about Crate-O.</p>
    <p></p><br />
    <h2 class="mb-3 text-lg md:text-xl">General Navigation</h2>
    <ul class="list-disc list-outside pl-5">
      <li><strong>Mode</strong> shows a list of predefined modes or allows you to load one from your computer.</li>
      <li><strong>Selected Directory</strong> shows the directory or folder you currently have open.</li>
      <li>Below <strong>Mode</strong>, you will see a home icon followed by a file path that indicates
        where you are located in the collection levels. This will change as you navigate to different sublevels.</li>
      <li>Depending on the metadata group, different types of metadata will be available:
        <ul class="list-disc list-outside pl-5">
          <li><strong>About</strong> - The core metadata for this RO-Crate and its subject matter.</li>
          <li><strong>Related People, Orgs & Works</strong> - The context for the creation of this RO-Crate; who made
            it, funded it etc.</li>
          <li><strong>Structure</strong> - How the parts of this RO-Crate relate, such as collection and object
            relationships.</li>
          <li><strong>Provenance</strong> - Detailed description of how entities were created, by whom and with which
            tools.</li>
          <li><strong>Space & Time</strong> - Where and when the data was collected; the times and places it mentions or
            describes.</li>
          <li><strong>Software & Hardware</strong> - For computer programs and execution environments that could be used
            to create data, have created data, or are being packaged and described.</li>
          <li><strong>Others</strong> - Other properties not in the above categories. Note that if you find a property
            in <i>Others</i> that should be in one of the above groups or have other suggestions, please raise an issue
            on <a href="https://github.com/Language-Research-Technology/crate-o" style="color:#3B82F6"
              target=_blank>GitHub</a>.
          </li>
        </ul>
      </li>
    </ul>
    <p>On the right-hand panel, there are some further options related to navigating and creating metadata entities:</p>
    <ul class="list-disc list-outside pl-5">
      <li><strong>Create New Entity</strong> - Create a new metadata entity, such as a
        provenance action such as <i>CreateAction</i>, which describes how a work is created with more precision than a
        property like <i>Author</i>.</li>
      <li><strong>Links from</strong> - When located in a sub-group, select to view the parent group(s).</li>
      <li><strong>All Entities</strong> - Select to view all metadata associated with your collection.</li>
      <li><strong>Unlinked Entities</strong> - Select to view all metadata that currently is not linked to any
        properties.</li>
    </ul>
    <br>
    <h2 class="mb-3 text-lg md:text-xl">Further Resources</h2>
    <p>For more detailed information on using Crate-O, particularly for language data, see
      the <a href="https://www.ldaca.edu.au/resources/user-guides/crate-o/" style="color:#3B82F6" target=_blank> LDaCA
        Crate-O User
        Guide</a>.</p>
  </div>

</template>

<style>
.info-toolbar h4 {
  font-weight: bold;
  margin-top: 0.5rem;
}
</style>