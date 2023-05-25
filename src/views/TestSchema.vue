<script setup>
var schemaorg;
(async function init() {
  const response = await fetch('https://schema.org/version/latest/schemaorg-current-https.jsonld');
  if (response.status === 200) {
    schemaorg = await response.json();
  }
  console.log(schemaorg);
})();
</script>
<template>
</template>