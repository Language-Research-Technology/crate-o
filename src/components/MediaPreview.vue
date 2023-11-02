<script setup>
import {watch, reactive} from "vue";

const props = defineProps(['file']);
const data = reactive({
  contents: ''
});

function getURL() {
  return URL.createObjectURL(props.file)
}

watch(() => props.file, async (newVal, oldVal) => {
  // data.activeLayout = state.meta[newVal['@id']].__activeLayout ??= 'About';
  if (props.file && props.file.type.startsWith('text/')) {
    data.contents = await props.file.text();
  }
}, {immediate: true});

</script>
<template>
  <template v-if="file">
    <div class="flex justify-center" v-if="file.type.startsWith('audio/')">
      <audio controls preload="none">
        <source :src="getURL()" :type="file.type">
        Your browser does not support the audio element.
      </audio>
    </div>
    <div class="flex justify-center" v-else-if="file.type.startsWith('video/')">
      <video controls>
        <source :src="getURL()" :type="file.type">
        Your browser does not support the video element.
      </video>
    </div>
    <div class="p-4" v-else-if="file.type.startsWith('image/')">
      <img height="500px" :src="getURL()"/>
    </div>
    <div v-else-if="file.type.startsWith('text/')">
      <div class="whitespace-pre-wrap max-h-[36rem] overflow-y-auto">{{ data.contents }}</div>
    </div>
    <div class="w-full" v-else-if="file.type.startsWith('application/pdf')">
      <iframe class="w-full h-[66rem] overflow-y-auto" style="width: 100%" :src="getURL()"/>
    </div>
  </template>
  <template v-else>
    File not found
  </template>
</template>