<script setup>
import Help from "./Help.vue";
import { ElRow, ElCol } from 'element-plus';

//TODO: Insert code that will load the readme markdown into here as html
</script>
<template>
  <el-row :gutter="20" class="p-20">
    <el-col :span="6" :xs="0" :sm="0" :md="4" :lg="6" :xl="8">
      <div class="grid-content ep-bg-purple"/>
    </el-col>
    <el-col :span="18" :xs="24" :sm="24" :md="20" :lg="18" :xl="16">
      <div class="grid gap-6">
        <h2 class="mb-3 text-lg text-gray-500 md:text-xl dark:text-gray-400">What is Crate-O?</h2>
        <p class="text-gray-500 dark:text-gray-400">
          Crate-O is a browser-based editor for <a class="text-blue-600 dark:text-blue-500 hover:underline"
                                                   href="https://www.researchobject.org/ro-crate" target="_blank"
                                                   rel="noopener noreferrer">Research Object Crates (RO-Crate)</a>.
          RO-Crate is a flexible,
          developer-friendly approach to linked-data description and packaging.
          </p>
          <p class="text-gray-500 dark:text-gray-400">
          Crate-O is designed to:
            <ul class="list-disc list-inside">
            <li>describe files on a user’s computer and to add contextual information about those files,</li>
            <li>skip the files and describe abstract contextual entities such as in a Cultural Collection or an encyclopaedia, or</li>
            <li>annotate existing resources elsewhere on the web.</li>
            </ul>
          </p>
        <p class="text-gray-500 dark:text-gray-400">
          Crate-O works only with <a class="text-blue-600 dark:text-blue-500 hover:underline"
                                href="https://google.com/chrome" target="_blank" rel="noopener noreferrer">Google
          Chrome</a> and <a class="text-blue-600 dark:text-blue-500 hover:underline" href="https://microsoft.com/edge"
                            target="_blank" rel="noopener noreferrer">Microsoft Edge</a> at this stage as it
          describes files on the user's
          computer, and saves RO-Crate metadata there. We will be releasing versions that work with online resources
          directly which will be compatible with other browsers (see the
          <a class="text-blue-600 dark:text-blue-500 hover:underline"
             href="https://github.com/Language-Research-Technology/crate-o#roadmap--backlog"
             target="_blank" rel="noopener noreferrer">Roadmap</a>).
        </p>
        <p class="text-gray-500 dark:text-gray-400">
          While the current version of Crate-O is designed for editing self-contained RO-Crates (and works fine with
          crates
          containing tens of thousands of entities) - our roadmap includes editing fragments of larger linked-data
          resources,
          and integration with Arkisto repositories such as the Oni repository, data API and search portal.
        </p>
        <p class="text-gray-500 dark:text-gray-400">
          Crate-O is currently developed by the <a class="text-blue-600 dark:text-blue-500 hover:underline"
                                                   href="https://www.ldaca.edu.au/" target="_blank"
                                                   rel="noopener noreferrer">Language Data Commons of Australia
          (LDaCA)</a>, under the guidance of
          Peter Sefton as technical lead. If the tool is adopted in other contexts (we are in talks with a few groups
          about this) then we aim to establish a steering committee/reference group to help guide development.
        </p>
      </div>
      <div class="grid gap-6">&nbsp;</div>
      <help/>
    </el-col>
  </el-row>

</template>