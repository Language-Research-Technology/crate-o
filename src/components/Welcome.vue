<script setup>
//TODO: Insert code that will load the readme markdown into here as html
</script>
<template>
  <el-row :gutter="20" class="p-20">
    <el-col :span="6" :xs="0" :sm="0" :md="4" :lg="6" :xl="8">
      <div class="grid-content ep-bg-purple"/>
    </el-col>
    <el-col :span="18" :xs="24" :sm="24" :md="20" :lg="18" :xl="16">
      <div class="grid gap-6">
        <h2 class="mb-3 text-lg text-gray-500 md:text-xl dark:text-gray-400"># What is Crate-O?</h2>
        <p class="text-gray-500 dark:text-gray-400">
          Crate-O is a browser-based editor for Research Object Crates ([RO-Crate]). RO-Crate is a flexible,
          developer-friendly approach to linked-data description and packaging . Crate-O is designed to:
          describe files on a user’s computer and to add contextual information about those files
          OR, to skip the files and describe abstract contextual entities such as in a Cultural Collection or an
          encyclopaedia
          OR to annotate existing resources elsewhere on the web
        </p>
        <p class="text-gray-500 dark:text-gray-400">
          NOTE: Crate-O is for Google Chrome and related browsers ONLY at this stage as it describes files on the users
          computer, and saves RO-Crate metadata there. We will be releasing versions that work with online resources
          directly
          which will be compatible with other browsers (see the Roadmap).
        </p>
        <p class="text-gray-500 dark:text-gray-400">
          While the current version of Crate-O is designed for editing self-contained RO-Crates (and works fine with
          crates
          containing tens of thousands of entities) - our roadmap includes editing fragments of larger linked-data
          resources,
          and integration with Arkisto repositories such as the [Oni] repository, data API & search portal.
        </p>
        <p class="text-gray-500 dark:text-gray-400">
          Crate-O is currently developed by the Language Data Commons of Australia ([LDaCA]), under the guidance of
          Peter
          Sefton as technical lead. If the tool is adopted in other contexts (we are in talks with a few groups about
          this) then we aim to establish a steering committee / reference group to help guide development.
        </p>
      </div>
    </el-col>
  </el-row>

</template>