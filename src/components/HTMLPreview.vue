<script setup>
import {Preview, Defaults} from 'ro-crate-html';
import template from 'ro-crate-html/defaults/metadata_template.html?raw';
import {ROCrate} from "ro-crate";
import {reactive, toRaw, watch} from "vue";

const props = defineProps(['crate']);
const emit = defineEmits(['compiled']);

const data = reactive({
  preview: null
});

watch(() => props.crate, async (data) => {
  console.log('watch crate');
  data.log = {
    info: [],
    warning: [],
    error: []
  };
  data.crate = null;
  const crate = new ROCrate(data, {array: true, link: true});
  data.preview = new Preview(crate);
  await data.preview.crate.resolveContext();
  var rootNode = data.preview.crate.getRootDataset();
  var name = rootNode.name;

  const render_script = Defaults.render_script;
  const summary = await data.preview.summarizeDataset();

  var date = new Date();
  var timestamp = date.getTime();
  const compiled_html = ejs.render(template, {
    html: summary,
    dataset_name: name,
    item_name: name,
    citation: data.preview.text_citation,
    up_link: "",
    time_stamp: timestamp,
    ROCrate_version: data.preview.crate.defaults.ROCrate_version,
    spec_id: data.preview.crate.defaults.DataCrate_Specification_Identifier,
    json_ld: JSON.stringify(data.preview.crate.getJson(), null, 2),
    render_script: render_script
  });
  // console.log(compiled_html);
  emit('compiled', compiled_html);
}, {immediate: true});

</script>
<template>
</template>