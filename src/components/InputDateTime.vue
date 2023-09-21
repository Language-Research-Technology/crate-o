<script setup>
import {ref, reactive, watch, computed} from "vue";
import {Clock, Calendar} from '@element-plus/icons-vue';
import {utilsByType} from './datetimeutils';
import moment from 'moment';

const props = defineProps({
  modelValue: [String, Date],
  type: {
    type: String,
    default: 'datetime',
    /**
     * @param {string} value
     */
    validator(value) {
      return (value in inputTypes);
    }
  }
});

const emit = defineEmits(['update:modelValue']);

const data = reactive({
  value: '',
  isValid: true
});

const acceptedFormats = [
  moment.ISO_8601,
  'YY/MM/DD',
  'YYYY/MM/DD',
  'YYYY/MM/DD HH:mm:ss',
  'DD/MM/YY',
  'DD/MM/YYYY',
  'DD/MM/YYYY HH:mm:ss',
  'M/D/YYYY',
  'D/M/YYYY',
  'MM/DD/YY',
  'MM/DD/YYYY',
  'MM/DD/YYYY HH:mm:ss',
];

watch(() => props.modelValue, (val) => {
  data.isValid = true;
  if (val) {
    const dateObj = moment(val, acceptedFormats, true);
    data.value = val;
    data.isValid = dateObj.isValid();
  } else {
    data.value = '';
    data.isValid = true;
  }
}, {immediate: true});

const pickerIcon = computed(() => props.type === 'time' ? Clock : Calendar);
const utils = computed(() => utilsByType[props.type]);
const nativeValue = computed(() => {
  if (data.isValid) {
    return data.value;
  }
});
const input = ref(null);
var tempValue;

function onInput(value) {
  const dateObj = moment(value, acceptedFormats, true);
  data.isValid = dateObj.isValid();
  data.value = value;
  tempValue = value
}

function onChange(value) {
  const dateObj = moment(tempValue, acceptedFormats, true);
  data.isValid = dateObj.isValid();
  if (data.isValid) {
    emit('update:modelValue', tempValue);
  }
}

function togglePicker() {
  input.value.showPicker();
}
</script>

<script>
const inputTypes = {time: 'time', date: 'date', datetime: 'datetime-local'};
export default {};
</script>


<template>
  <div class="flex flex-col flex-grow">
    <el-input v-model="data.value" type="text" :class="{ 'is-error': !data.isValid }"
              @input="onInput" @change="onChange">
      <template #append>
        <el-button :icon="pickerIcon" @click="togglePicker"></el-button>
        <input ref="input" class="native-picker" :value="nativeValue"
               @input="onInput($event.target.value)" @change="onChange"
               :type="inputTypes[props.type]"/>
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
        E.g.: 2021-03-22, 2021-03, 2021 or using 'YYYY/MM/DD', 'DD/MM/YYYY', 'MM/DD/YYYY', 'DD/MM/YY', 'YY/MM/DD'
      </div>
      <div class="text-xs text-red-700" v-if="props.type === 'datetime'">
        Datetime value must be in <a class="font-bold hover:underline" target=”_blank”
                                     href="https://www.w3.org/TR/NOTE-datetime">ISO 8601 format</a>.
        E.g.: 2021-03-22T03:23:00, 2021-03-22, 2021 or using 'YYYY/MM/DD', 'DD/MM/YYYY', 'MM/DD/YYYY', 'DD/MM/YY', 'YY/MM/DD'
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