<script setup>
import { ref, reactive, watch, computed } from "vue";
import { Clock, Calendar } from '@element-plus/icons-vue';
import { ElInput, ElButton } from 'element-plus';
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
  value: ''
  //isValid: true
});

watch(() => props.modelValue, (val) => {
  if (val === data.value) return;
  var utils = utilsByType[props.type];
  if (val instanceof Date) {
    data.value = utils.dateTo(val);
    //data.isValid = !isNaN(val.valueOf());
  } else { // handle string input
    data.value = val || '';
    //data.isValid = data.value.split('/').reduce((r, d) => r &&= !isNaN(utils.dateFrom(d)), true);
  }
}, { immediate: true });

const pickerIcon = computed(() => props.type === 'time' ? Clock : Calendar);
//const utils = computed(() => utilsByType[props.type]);
const dates = computed(() => data.value.split('/'));
const nativeValue1 = computed(() => utilsByType[props.type].toNative(dates.value[0]));
const nativeValue2 = computed(() => utilsByType[props.type].toNative(dates.value[1]));
const isValid = computed(() => dates.value.reduce((r, d) => r &&= !isNaN(utilsByType[props.type].dateFrom(d)), true));
const hintStart = computed(() => `Pick a ${dates.value.length > 1 ? 'start ' : ''}${props.type}`);
const hintEnd = computed(() => `Pick a ${dates.value.length > 1 ? 'end ' : ''}${props.type}`);
const inputStart = ref(null);
const inputEnd = ref(null);

function update(i, value) {
  var utils = utilsByType[props.type];
  var vals = dates.value;
  var newVal = utils.fromNative(value, vals[i]) || '';
  if (vals[i] !== newVal) {
    vals[i] = newVal;
    data.value = vals.join('/');
  }
  //var d = data.value ? utils.dateFrom(data.value, props.modelValue) : new Date(0);
  //data.isValid = !isNaN(d);
  //data.isValid = dates.value.reduce((r, d) => r &&= !isNaN(utils.dateFrom(d)), true);
}

function onChange() {
  if (isValid.value) {
    let val = data.value;
    if (props.modelValue instanceof Date) {
      val = dates.value.map(d => utilsByType[props.type].dateFrom(d, props.modelValue));
      if (val.length === 1) val = val[0];
    }
    emit('update:modelValue', val);
  }
}

function togglePickerStart() {
  inputStart.value.showPicker();
}
function togglePickerEnd() {
  inputEnd.value.showPicker();
}
</script>

<script>
const inputTypes = { time: 'time', date: 'date', datetime: 'datetime-local' };
export default {};
</script>


<template>
  <div class="flex flex-col flex-grow input-date-time">
    <el-input v-model="data.value" type="text" :class="{ 'is-error': !isValid }" @change="onChange">
      <template #append>
        <el-button :icon="pickerIcon" @click="togglePickerStart" :title="hintStart"></el-button>
        <input ref="inputStart" class="native-picker" :value="nativeValue1" @input="update(0, $event.target.value)"
          @change="onChange" :type="inputTypes[type]" />
        <template v-if="dates.length > 1">
          <span>/</span>
          <el-button :icon="pickerIcon" @click="togglePickerEnd" :title="hintEnd"></el-button>
          <input ref="inputEnd" class="native-picker" :value="nativeValue2" @input="update(1, $event.target.value)"
          @change="onChange" :type="inputTypes[type]" />
        </template>
      </template>
    </el-input>

    <template v-if="!isValid">
      <div class="text-xs text-red-700" v-if="type === 'time'">
        Time value must be in <a class="font-bold hover:underline" target=”_blank”
          href="https://www.w3.org/TR/NOTE-datetime">ISO 8601 format</a>.
        E.g.: 03:23:00, 03:23:00.001, 03:23:00+10, 03:23:00Z
      </div>
      <div class="text-xs text-red-700" v-if="type === 'date'">
        Date value must be in <a class="font-bold hover:underline" target=”_blank”
          href="https://www.w3.org/TR/NOTE-datetime">ISO 8601 format</a>.
        E.g.: 2021-03-22, 2021-03, 2021
      </div>
      <div class="text-xs text-red-700" v-if="type === 'datetime'">
        Datetime value must be in <a class="font-bold hover:underline" target=”_blank”
          href="https://www.w3.org/TR/NOTE-datetime">ISO 8601 format</a>.
        E.g.: 2021-03-22T03:23:00, 2021-03-22, 2021, 2021/2022
      </div>
    </template>
  </div>
  <!--input :value="modelValue" @input="$emit('update:modelValue', $event.target.value)"/-->
</template>

<style>
.el-input.is-error .el-input__wrapper {
  box-shadow: 0 0 0 1px var(--el-color-danger) inset;
}
.input-date-time .el-input-group__append {
  padding: 0;
}
.input-date-time .el-input-group__append .el-button {
  margin: 0;
}

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