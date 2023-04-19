<script setup>
import {onMounted, onUpdated, reactive} from "vue";

const props = defineProps(['id', 'name', 'value', 'index', 'property', 'deletable']);

const data = reactive({
  newValue: props.value
});
//NOTE: this bellow seems wrong!
onMounted(() => {
  data.newValue = props.value;
})
onUpdated(() => {
  data.newValue = props.value;
});

const emit = defineEmits(['newEntity', 'removeValue'])

</script>
<template>
  <el-row>
    <el-col :span="24">
      <el-button-group v-if="value?.['@id']">
        <el-button
            type="primary" plain
            :name="name"
            :id="name"
            @click="$emit('newEntity', value?.['@id'])"
            color="#626aef">
          <i class="fa-solid fa-pencil"></i>&nbsp;{{ value['name']?.['0'] || value['@id'] }}
        </el-button>
        <el-button color="#626aef" type="primary" plain
                   @click="$emit('removeValue')">
          <i class="fa-solid fa-trash"></i>
        </el-button>
      </el-button-group>
      <el-input v-else
                :name="name"
                :id="name"
                type="text"
                v-model="data.newValue">
        <template #append v-if="deletable">
          <el-button @click="$emit('removeValue', {index})"><i class="fa-solid fa-trash"></i></el-button>
        </template>
      </el-input>
    </el-col>
  </el-row>
</template>