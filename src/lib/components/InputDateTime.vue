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
  moment.ISO_8601
];

watch(() => props.modelValue, (val) => {
  data.isValid = true;
  if (val) {
    data.value = val;
    data.isValid = data.isValid = validate(val);
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
  data.isValid = validate(value);
  data.value = value;
  tempValue = value
}

function onChange(event) {
  if (event.target && event.target.value) {
    data.isValid = validate(event.target.value);
  }
  if (data.isValid) {
    emit('update:modelValue', tempValue);
  }
}

function togglePicker() {
  input.value.showPicker();
}

function validate(value) {
  let isValid = false;
  if (typeof value === 'string') {
    const values = value.split(/\//);
    if (values[0] && values[1]) {
      const dateObj1 = moment(values[0], acceptedFormats, true);
      if (dateObj1.isValid()) {
        const dateObj2 = moment(values[1], acceptedFormats, true);
        if (dateObj2.isValid()) {
          isValid = true;
        }
      }
    } else {
      const dateObj = moment(value, acceptedFormats, true);
      isValid = dateObj.isValid();
    }
  }
  return isValid;
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
        E.g.: 2021-03-22, 2021-03, 2021
      </div>
      <div class="text-xs text-red-700" v-if="props.type === 'datetime'">
        Datetime value must be in <a class="font-bold hover:underline" target=”_blank”
                                     href="https://www.w3.org/TR/NOTE-datetime">ISO 8601 format</a>.
        E.g.: 2021-03-22T03:23:00, 2021-03-22, 2021, 2021/2022
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