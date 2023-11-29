<script setup>
import { watch, reactive } from "vue";
import mime from 'mime/lite';
import { ElButton } from "element-plus";

const props = defineProps(['file']);
const data = reactive({
  contents: '',
  error: ''
});

function isText(file) {
  console.log(file);
  const fileType = file.type || mime.getType(file.name) || '';
  return fileType.startsWith('text/') || fileType.match('json');
}

watch(() => props.file, async (newVal, oldVal) => {
  try {
    if (props.file && isText(props.file)) {
      data.contents = await props.file.text();
    }
  } catch (error) {
    data.error = error;
  }
}, { immediate: true });

async function showTextPreview() {
  data.contents = await props.file.text();
}
</script>
<template>
  <template v-if="file">
    <div v-if="data.error">
      {{ data.error }}
    </div>
    <div class="flex justify-center" v-else-if="file.type.startsWith('audio/')">
      <audio controls preload="none">
        <source :src="file.url" :type="file.type">
        Your browser does not support the audio element.
      </audio>
    </div>
    <div class="flex justify-center" v-else-if="file.type.startsWith('video/')">
      <video controls>
        <source :src="file.url" :type="file.type">
        Your browser does not support the video element.
      </video>
    </div>
    <div class="p-4" v-else-if="file.type.startsWith('image/')">
      <img height="500px" :src="file.url" />
    </div>
    <div class="w-full" v-else-if="file.type.startsWith('application/pdf')">
      <iframe class="w-full h-[66rem] overflow-y-auto" style="width: 100%" :src="file.url" />
    </div>
    <div v-else-if="data.contents" class="w-full">
      <div class="whitespace-pre-wrap max-h-[36rem] overflow-scroll p-2 bg-slate-100 font-mono drop-shadow text-sm">{{ data.contents }}</div>
    </div>
    <div v-else>
      The file type is either unrecognized or unsupported.<br/>
      <el-button type="warning" @click="showTextPreview">Force preview as text</el-button>
    </div>
  </template>
  <template v-else>
    File not found
  </template>
</template>