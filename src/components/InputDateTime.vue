<script setup>
import { ref, reactive, watch, computed } from "vue";
import { Clock, Calendar } from '@element-plus/icons-vue';
import { utilsByType } from './datetimeutils';

const props = defineProps({
  modelValue: [String, Date],
  type: {
    type: String,
    default: 'datetime',
    /**
     * @param {string} value 
     */
    validator(value) { return (value in inputTypes); }
  }
});

const emit = defineEmits(['update:modelValue']);

const data = reactive({
  value: '',
  isValid: true
});


watch(() => props.modelValue, (val) => {
  var utils = utilsByType[props.type];
  if (val) {
    if (val instanceof Date) {
      data.value = utils.dateTo(val);
      data.isValid = !isNaN(val.valueOf());
    } else {
      data.value = val;
      data.isValid = !isNaN(utils.dateFrom(val));
    }
  } else {
    data.value = '';
    data.isValid = true;
  }
}, { immediate: true });

const pickerIcon = computed(() => props.type === 'time' ? Clock : Calendar);
const utils = computed(() => utilsByType[props.type]);
const nativeValue = computed(() => data.isValid ? utils.value.toNative(data.value) : '');
const input = ref(null);
var tempValue;

function onInput(value) {
  var utils = utilsByType[props.type];
  if (data.value !== value) {
    data.value = utils.fromNative(value, data.value);
    //console.log(data.valString);
  }
  var mv = props.modelValue;
  var d = data.value ? utils.dateFrom(data.value, mv) : new Date(0);
  data.isValid = !isNaN(d);
  if (data.isValid) {
    tempValue = mv instanceof Date ? d : data.value;
  }
}

function onChange(value) {
  if (data.isValid) {
    emit('update:modelValue', tempValue);
  }
}

function togglePicker() {
  input.value.showPicker();
}
</script>

<script>
const inputTypes = { time: 'time', date: 'date', datetime: 'datetime-local' };
export default {};
</script>


<template>
  <div class="flex flex-col flex-grow">
    <el-input v-model="data.value" type="text" :class="{ 'is-error': !data.isValid }" @input="onInput" @change="onChange">
      <template #append>
        <el-button :icon="pickerIcon" @click="togglePicker"></el-button>
        <input ref="input" class="native-picker" :value="nativeValue" 
        @input="onInput($event.target.value)" @change="onChange"
          :type="inputTypes[props.type]" />
      </template>
    </el-input>
    <template v-if="!data.isValid">
      <div class="text-xs text-red-700" v-if="props.type === 'time'">
        Time value must be in <a class="font-bold hover:underline" target=”_blank”
          href="https://www.w3.org/TR/NOTE-datetime">ISO 8601 format</a>.
        E.g.: 03:23:00, 03:23:00.001, 03:23:00+10, 03:23:00Z
      </div>
      <div class="text-xs text-red-700" v-if="props.type === 'date'">
        Date value must be in <a class="font-bold hover:underline" target=”_blank”
          href="https://www.w3.org/TR/NOTE-datetime">ISO 8601 format</a>.
        E.g.: 2021-03-22, 2021-03, 2021
      </div>
      <div class="text-xs text-red-700" v-if="props.type === 'datetime'">
        Datetime value must be in <a class="font-bold hover:underline" target=”_blank”
          href="https://www.w3.org/TR/NOTE-datetime">ISO 8601 format</a>.
        E.g.: 2021-03-22T03:23:00, 2021-03-22, 2021
      </div>
    </template>
  </div>
  <!--input :value="modelValue" @input="$emit('update:modelValue', $event.target.value)"/-->
</template>

<style scoped>
input.native-picker {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  box-sizing: border-box;
  z-index: -1;
}
</style>