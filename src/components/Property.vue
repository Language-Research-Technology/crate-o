<script setup>
import {reactive, computed, toRaw, nextTick, inject, isReactive} from "vue";
import {QuestionFilled, Delete, InfoFilled, WarningFilled, ArrowRight, ArrowLeft} from '@element-plus/icons-vue';
import ControlAdd from "./ControlAdd.vue";
import {$state} from './keys';
import {first} from "lodash";

const state = inject($state);
const pageSize = 10; //Later do in conf the page size

const props = defineProps({
  modelValue: {
    /** @type import('vue').PropType<any[]|string> */
    type: undefined
  },
  components: {type: Array, required: true},
  definition: {type: Object, required: true}
});
const emit = defineEmits(['update:modelValue', 'entityCreated']);

const label = computed(() => {
  var label = props.definition.label || props.definition.name || props.definition.id;
  if (typeof label !== 'string') label = 'error';
  var namespace;
  var isUrl;
  try {
    const url = new URL(label);
    if (url.host) {
      label = url.pathname.split('/').pop();
      isUrl = true;
    }
  } catch (error) {
  }
  if (!isUrl) {
    let m = label.match(/(.+):(.+)/);
    if (m) [, namespace, label] = m;
  }
  label = label.charAt(0).toUpperCase() + label.slice(1);
  return label.replace(/([a-z])([A-Z])/g, '$1 $2');
});

const isReverse = computed(() => {
  if(props.definition.isReverse) {
    return true;
  }
});

const values = computed(() => {
  const value = props.modelValue;
  //return value ? (Array.isArray(value) ? value : [value]) : [];
  return Array.isArray(value) ? value : (value == null ? [] : [value]);
});

function add(type, value, fromLookup) {
  //console.log(props.definition);
  //console.log('addValue', type, value);
  //console.log(vals.length);
  var vals = values.value;
  var val = value;
  var isInline = state.isInline(type);
  if (isInline) {
    const options = props.definition.values;
    const propsOpt = {...props.definition.props, ...(options && {options})};
    const c = props.components[vals.length] = state.getInlineComponent(type, propsOpt);
    val ??= c[2];
  }
  vals.push(val ?? '');
  console.log('add val:', val);

  emit('update:modelValue', vals);
  if (typeof value === 'object' && value['@id']) {
    const entity = state.crate.getEntity(value['@id']);
    state.ensureContext(entity['@type']);
    state.entities.push(entity);
    if (!fromLookup && !isInline) emit('entityCreated', entity);
  }
}

function updateValue(i, value) {
  const vals = toRaw(props.modelValue);
  if (Array.isArray(vals)) {
    vals[i] = value;
    emit('update:modelValue', vals);
  } else {
    emit('update:modelValue', value);
  }
}

function removeValue(i, value) {
  const vals = toRaw(props.modelValue);
  if (Array.isArray(vals)) {
    vals.splice(i, 1);
    props.components.splice(i, 1);
    if (typeof value === 'object' && value['@id']) {
      // count all reverse links
      let linksCount;
      const rawValue = toRaw(value); //converting it to raw to check the links count because it errors if reverses where empty
      //Uncaught TypeError: 'get' on proxy: property '@reverse' is a read-only and non-configurable data property on the proxy target but the proxy did not return its actual value
      if (rawValue['@reverse']) {
        linksCount = Object.values(rawValue['@reverse']).reduce((count, refs) => count + refs.length, 0);
      }
      if (!linksCount) {
        //todo: confirm to delete entity
        const i = state.entities.findIndex(e => e['@id'] === value['@id']);
        if (i >= 0) state.entities.splice(i, 1);
        nextTick(() => {
          state.crate.deleteEntity(value);
        });
      }
    }
    emit('update:modelValue', vals);
  }
}

</script>

<template>
  <!-- <el-form-item class="hover:bg-violet-100 px-2 p-2"> -->
  <!-- TODO: !!! remove hack of checking the ro-crate-metadata.json-->
  <el-form-item :class="[ isReverse ? 'bg-teal-100 border-1 border-teal-500 rounded-b text-teal-900 px-4 py-3 shadow-md' : 'px-2 p-2', 'px-2 p-2']" v-if="first(values)?.['@id'] !== 'ro-crate-metadata.json'">
    <template #label>
      <el-tooltip v-if="definition?.required"
                  content="Property Required"
                  placement="bottom-start"
                  effect="light"
      >
        <el-icon>
          <WarningFilled class="text-red-600"/>
        </el-icon>
      </el-tooltip>
      <span class="mx-1" :title="definition.id">{{ label }} </span>
      <el-icon v-if="isReverse"><ArrowLeft /></el-icon>
      <el-icon v-else><ArrowRight /></el-icon>
      <!--Tooltip Commented out for issue https://github.com/Language-Research-Technology/crate-o/issues/78 -->
      <!--      <el-tooltip v-if="definition.help"-->
      <!--                  :content="definition.help"-->
      <!--                  placement="bottom-start"-->
      <!--                  effect="light"-->
      <!--      >-->
      <!--        <el-icon>-->
      <!--          <InfoFilled/>-->
      <!--        </el-icon>-->
      <!--      </el-tooltip>-->
    </template>
    <div class="flex flex-col flex-grow">
      <FilteredPaged :modelValue="values" v-slot="{ value, index }">
        <template
            v-for="[component, componentProps] of [(components[index] ??= state.resolveComponent(value, definition))]">
          <component :is="component" v-bind="componentProps" :modelValue="value"
                     @update:modelValue="value => updateValue(index, value)">
          </component>
        </template>
        <div class="pl-2 flex flex-nowrap" v-if="!isReverse" >
          <!-- Delete Button -->
          <el-tooltip v-if="definition?.min >= values.length"
                      content="This property is required and cannot be deleted"
                      placement="bottom-start"
                      effect="light">
            <el-button :disabled="true" @click="removeValue(index, value)" type="default" plain
                       :icon="Delete" size="small"></el-button>
          </el-tooltip>
          <el-button v-else @click="removeValue(index, value)" type="danger" plain
                     :icon="Delete" size="small"></el-button>
        </div>
      </FilteredPaged>

      <ControlAdd v-if="!isReverse" :modelValue="values" :definition="definition" class="flex flex-col md:flex-row gap-1 flex-nowrap"
                  @add="add">
      </ControlAdd>
      <div v-if="definition.help" class="flex items-center bg-indigo-100 text-sm text-indigo-500 px-4 py-3 mt-2"
           role="alert">
        <el-icon>
          <InfoFilled/>
        </el-icon>&nbsp;<p>{{ definition.help }}</p>
      </div>
    </div>
  </el-form-item>
</template>

<style scoped>
.el-form-item {
  margin-bottom: 0px;
}
</style>