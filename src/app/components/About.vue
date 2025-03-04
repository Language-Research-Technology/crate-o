<script setup>
import { ref } from 'vue';
import { marked } from 'marked';

const aboutContent = ref();
(async function(){
  try {
    const markdown = await (await fetch('./README.md')).text();
    aboutContent.value = marked(slice_anchors(markdown));  
  } catch (error) {
    console.error('Error fetching the Markdown file:', error);
  }
})();


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
  .about h1 {
    @apply mb-3 text-xl md:text-xl text-gray-500
  }
  .about h2 {
    @apply mb-3 text-lg md:text-xl text-gray-500
  }
  .about div {
    @apply grid gap-2 text-gray-500 dark:text-gray-400 grid gap-2
  }
  .about a {
    @apply text-blue-600 dark:text-blue-500 hover:underline
  }
  .about ul {
    @apply list-disc list-inside text-gray-500
  }
  .about p {
    @apply text-gray-500
  }
</style>
<template>
  <div class="grid gap-2 text-gray-500 dark:text-gray-400 about" v-html="aboutContent"></div>
  <div class="grid gap-2 text-gray-500 dark:text-gray-400">
    <br>
    <p class="">
      <!-- I don't know why these hidden links are needed but they are -->
      <a class="text-blue-600 dark:text-blue-500 hover:underline"
        href="ldaca.edu.au" target="_blank" rel="noopener noreferrer"></a><a class="text-blue-600 dark:text-blue-500 hover:underline" href="https://www.ldaca.edu.au/"
        target="_blank" rel="noopener noreferrer"></a>
    </p>
  </div>
</template>