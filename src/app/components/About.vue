<script setup>
import { marked } from 'marked';

fetch('./README.md')
      .then(response => response.text())
      .then(markdown => {
        const htmlContent = marked(slice_anchors(markdown));
        document.getElementById("about_html_content").innerHTML = htmlContent;
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
  #about_html_content h1 {
    @apply mb-3 text-xl md:text-xl text-gray-500
  }
  #about_html_content h2 {
    @apply mb-3 text-lg md:text-xl text-gray-500
  }
  #about_html_content div {
    @apply grid gap-2 text-gray-500 dark:text-gray-400 grid gap-2
  }
  #about_html_content a {
    @apply text-blue-600 dark:text-blue-500 hover:underline
  }
  #about_html_content ul {
    @apply list-disc list-inside text-gray-500
  }
  #about_html_content p {
    @apply text-gray-500
  }
</style>
<template>
  <div class="grid gap-2 text-gray-500 dark:text-gray-400" id="about_html_content"></div>
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