<script setup>
import { marked } from 'marked';

fetch('./README.md')
      .then(response => response.text())
      .then(markdown => {
        const htmlContent = marked(slice_anchors(markdown));
        document.getElementById("htmlContent").innerHTML = htmlContent;
      })
      .catch(error => console.error('Error fetching the Markdown file:', error))

// Finds indexes of substrings in string
function indexes(substring, string){
  var a=[],i=-1;
  while((i=string.indexOf(substring,i+1)) >= 0) {
    substring.includes("Start") ? a.push([i + 14]) : a.push(i);
  }
  return a;
}

function slice_anchors(markdown) {
  var starts = indexes("<!---Start--->", markdown);
  var ends = indexes("<!---End--->", markdown);
  var md_sliced = "";
  try {
    for (let i = 0; i < starts.length; i++) {
      console.log("md slice from ", starts[i], " to ", ends[i], ": ", markdown.slice(starts[i], ends[i]))
      md_sliced += markdown.slice(starts[i], ends[i]);
    }
    return md_sliced;
  } catch(err) {
    console.log(err);
  }
}

//TODO: Insert code that will load the readme markdown into here as html
</script>
<style>
  h1 {
    @apply mb-3 text-xl md:text-xl
  }
  h2 {
    @apply mb-3 text-lg md:text-xl
  }
  div {
    @apply grid gap-2 text-gray-500 dark:text-gray-400
  }
  a {
    @apply text-blue-600 dark:text-blue-500 hover:underline
  }
  ul {
    @apply list-disc list-inside
  }
</style>
<template>
  <div id="htmlContent"></div>
  <div class="grid gap-2 text-gray-500 dark:text-gray-400">
    

    <h2 class="mb-3 text-lg md:text-xl">About Crate-O</h2>
    <p class="">
      Crate-O is a browser-based editor for <a class="text-blue-600 dark:text-blue-500 hover:underline"
        href="https://www.researchobject.org/ro-crate" target="_blank" rel="noopener noreferrer">Research Object Crates
        (RO-Crate)</a>.
      RO-Crate is a flexible,
      developer-friendly approach to linked-data description and packaging.
    </p>
    <p class="">Crate-O is designed to:</p>
    <ul class="list-disc list-inside">
      <li>describe files on a user’s computer and to add contextual information about those files,</li>
      <li>skip the files and describe abstract contextual entities such as in a Cultural Collection or an encyclopaedia,
        or</li>
      <li>annotate existing resources elsewhere on the web.</li>
    </ul>
    
    <p class="">
      Crate-O works only with <a class="text-blue-600 dark:text-blue-500 hover:underline"
        href="https://google.com/chrome" target="_blank" rel="noopener noreferrer">Google
        Chrome</a> and <a class="text-blue-600 dark:text-blue-500 hover:underline" href="https://microsoft.com/edge"
        target="_blank" rel="noopener noreferrer">Microsoft Edge</a> at this stage as it
      describes files on the user's
      computer, and saves RO-Crate metadata there. We will be releasing versions that work with online resources
      directly which will be compatible with other browsers (see the
      <a class="text-blue-600 dark:text-blue-500 hover:underline"
        href="https://github.com/Language-Research-Technology/crate-o#roadmap--backlog" target="_blank"
        rel="noopener noreferrer">Roadmap</a>).
    </p>
    <p class="">
      While the current version of Crate-O is designed for editing self-contained RO-Crates (and works fine with
      crates
      containing tens of thousands of entities) - our roadmap includes editing fragments of larger linked-data
      resources,
      and integration with Arkisto repositories such as the Oni repository, data API and search portal.
    </p>
    <p class="">
      Crate-O is currently developed by the <a class="text-blue-600 dark:text-blue-500 hover:underline"
        href="https://www.ldaca.edu.au/" target="_blank" rel="noopener noreferrer">Language Data Commons of Australia
        (LDaCA)</a>, under the guidance of
      Peter Sefton as technical lead. If the tool is adopted in other contexts (we are in talks with a few groups
      about this) then we aim to establish a steering committee/reference group to help guide development.
    </p>
  </div>
</template>