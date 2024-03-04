<script setup>
import { reactive, computed } from 'vue';
import { Delete } from '@element-plus/icons-vue';
import { ElContainer, ElHeader, ElMain, ElForm, ElFormItem, ElSelect, ElOption, ElButton } from 'element-plus';

import InputDateTime from '../../lib/components/InputDateTime.vue';
import InputGeo from '../../lib/components/InputGeo.vue';
import InputText from '../../lib/components/InputText.vue';
import InputSelect from '../../lib/components/InputSelect.vue';
import FilteredPaged from '../../lib/components/FilteredPaged.vue';

const testValues = [
  {
    "@id": "txc:ElicitationTask",
    "@type": "DefinedTerm",
    "description": "The collection protocol includes a task-based prompt to participants",
    "inDefinedTermSet": {
      "@id": "txc:CollectionProtocolTypeTerms"
    },
    "name": "ElicitationTask"
  },
  {
    "@id": "txc:TextSelectionCriteria",
    "@type": "DefinedTerm",
    "description": "A description of the criteria used to select texts in a collection",
    "inDefinedTermSet": {
      "@id": "txc:CollectionProtocolTypeTerms"
    },
    "name": "TextSelectionCriteria"
  },
  {
    "@id": "#testid",
    "name": "Test",
    "description": "Test description"
  }
];
const textOptions = ['aaa', 'abc', 'bbbb', 'bbc'].map(e => ({ value: e, label: e }));
const objectOptions = testValues.map(e => ({ value: e, label: e.name }));
const inputs = [
  { label: 'time', component: InputDateTime, props: { type: 'time' } },
  { label: 'date', component: InputDateTime, props: { type: 'date' } },
  { label: 'datetime', component: InputDateTime, props: { type: 'datetime' } },
  //{ label: 'geo', component: InputGeo, props: { type: '' } },
  { label: 'number', component: InputText, props: { type: 'number' } },
  { label: 'text', component: InputText, props: { type: 'text' } },
  { label: 'textarea', component: InputText, props: { type: 'textarea' } },
  { label: 'url', component: InputText, props: { type: 'url' } },
  // { label: 'select', component: 'el-select-v2', props: { filterable: true, clearable: true, options: textOptions } },
  // { label: 'selectobject', component: 'el-select-v2', props: { filterable: true, clearable: true, options: objectOptions, 'value-key': 'value[@id]', onChange } },
  { label: 'select', component: InputSelect, props: { options: ['aaa', 'abc', 'bbbb', 'bbc'] } },
  { label: 'selectobject', component: InputSelect, props: { options: testValues } },
  { label: 'boolean', component: 'el-checkbox', props: { border: true } }

];
const data = reactive({
  test: 'a',
  datetime: '',
  values: {},
  form: {},
  select: null,
  options: [
    {name:'a', desc:'da', test: 1},
    {name:'b', desc:'db', test: 2},
    {name:'cc', desc:'dc', test: 3}
  ],
  items: ['aaabbb', 'cccddd', 'sadfdsaf', 'eqwrds', 'xcvds', 'bbbbb', 'bbdfdasd', 'asdfdsf', 'gewrdsf', 'asdfsa', 'fgddaf', 'sgfdsg']
});
window.data = data;
function deleteProperty() {

}
function test1(v) { console.log(v); }
function test2() { console.log('fntest2'); }
function alert(s) {
  window.alert(s);
}
</script>

<template>
  <el-container>
    <el-header>
      <h1 class="text-2xl">Test Vue Components</h1>
    </el-header>
    <el-main>
      <h2 class="text-xl">Input types</h2>
      <el-form label-width="auto" novalidate>
        <template v-for="input in inputs" :key="input">
          <el-form-item :label="input.label">
            <component class="flex-grow" :is="input.component" v-model="data.values[input.label]" v-bind="input.props">
            </component>
            <div class="pl-2 flex flex-nowrap">
              <el-button @click="deleteProperty" type="danger" plain :icon="Delete"></el-button>
              <el-button> Test </el-button>
            </div>
          </el-form-item>
          <el-form-item><input type="text" v-model="data.values[input.label]" /></el-form-item>
        </template>
      </el-form>
      <!-- <InputGeo v-model="data.test" @update:model-value="test1"></InputGeo> -->
      <div v-for="i in 10">{{ i }}</div>
      <el-select v-model="data.select" value-key="name" @change="test1">
        <el-option v-for="item in data.options" :key="item.name" :value="item" :label="item.name">
          {{ item.name }} - {{ item.desc }}
        </el-option>
      </el-select>
      <FilteredPaged v-model="data.items" v-slot="{ index }">
        <el-button @click="alert(data.items[index])">{{ data.items[index] }}</el-button>
      </FilteredPaged>
    </el-main>
  </el-container>
</template>
<style>
.el-form-item__content {
  flex-wrap: nowrap;
  align-items: start;
}
</style>