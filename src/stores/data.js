import { ref } from 'vue';
import { ROCrate } from 'ro-crate';
import InputDateTime from '../components/InputDateTime.vue';
import InputGeo from '../components/InputGeo.vue';
import InputText from '../components/InputText.vue';
import InputSelect from '../components/InputSelect.vue';
import LinkEntity from '../components/LinkEntity.vue';
import dateTimeUtils from '../components/datetimeutils';
import lookupModules from '../lookups';

const entityComponent = [LinkEntity, {}];
const primitiveComponents = {
  boolean: ['el-checkbox', { border: true }],
  text: [InputText, { type: 'textarea' }],
  textarea: [InputText, { type: 'textarea' }],
  number: [InputText, { type: 'number' }],
  url: [InputText, { type: 'url' }],
  time: [InputDateTime, { type: 'time' }],
  date: [InputDateTime, { type: 'date' }],
  datetime: [InputDateTime, { type: 'datetime' }],
  select: [InputSelect],
  selectobject: [InputSelect],
  selecturl: [InputSelect],
  value: [InputText, { type: 'text', disabled: true }]
};
const primitiveTypes = new Set(Object.keys(primitiveComponents));

const jsonldKeywords = {
  // '@context': {
  //   _component: [InputText]
  // },
  '@id': {
    id: '@id',
    name: '@id',
    component: InputText,
    min: 1,
    max: 1
  },
  '@type': {
    id: '@type',
    name: '@type',
    component: InputSelect,
    type: ['Select'],
    props: {allowCreate: true},
    min: 1
  }
  // '@value': {
  //   _component: [InputText],
  // }
};

const lookupPromises = {};

function isUri(value) {
  try {
    var u = new URL(value);
    return true;
  } catch (error) {
    return false;
  }
}

export class DataStore {
  /** @type {ROCrate} */
  static crate;
  static meta; // cache data type info of each actual value of properties
  static profile = ref(null);
  /** definition cache */
  static defByType;
  static async setCrate(rawCrate) {
    this.crate = new ROCrate(rawCrate, { array: true, link: true });
    this.meta = {};
    await this.crate.resolveContext();
    return this.crate;
  }

  static setProfile(profile) {
    this.profile.value = profile;
    this.defByType = {};
    // set select options for @type lookup
    jsonldKeywords['@type'].props.options = profile.enabledClasses;
    // async load lookup modules
    for (const type in profile.lookup) {
      const l = profile.lookup[type];
      const mod = l.module || "datapack";
      lookupPromises[type] = import(/* @vite-ignore */mod).catch((e) => {}).
        then(m => new (m?.default || lookupModules[mod])({type, ...l})).
        catch(e => {});
    }
    return profile;
  }

  /**
   * Get property definitions based on type as defined in profile 
   * @param {string[]} types 
   */
  static getProfileDefinitions(types = []) {
    const profile = this.profile.value;
    const defByType = this.defByType;
    const common = { ...jsonldKeywords };
    if (!profile) return {};
    if (!types.length) return common;
    const typesId = types.join('|');
    if (!defByType[typesId]) {
      let definitions = common;
      const classes = types.map(t => profile.classes[t]).filter(e => e);
      for (const c of classes) {
        for (const input of (c.inputs || [])) {
          if (!definitions[input.id] || c.definition === 'override') {
            const { required, multiple, ...def } = input;
            def.min = required ? 1 : 0;
            def.max = multiple ? Infinity : 1;
            definitions[input.id] = def;
          }
        }
      }
      defByType[typesId] = definitions;
    }
    return defByType[typesId];
  }

  /**
   * Get property definitions based on actual entity data
   * @param {Object} entity 
   */
  static getDefinitions(entity = {}) {
    const types = entity['@type'];
    const definitions = {...this.getProfileDefinitions(types)};

    // find existing properties in the entity data that are not yet included
    const crate = this.crate;
    const undefinedProperties = new Map(Object.keys(entity).map(name => [crate?.resolveTerm(name) || name, name]));
    for (const defId in definitions) {
      // if (definitions[defId].name in entity && !undefinedProperties.has(defId)) {
      //   definitions[defId] = { ...definitions[defId], name:defId };
      // }
      undefinedProperties.delete(defId) || undefinedProperties.delete(definitions[defId].name);
    }
    // create definition for properties not defined in the profile inputs
    //console.log(undefinedProperties);
    for (const [id, name] of undefinedProperties) {
      definitions[id] = { id, name };
    }
    //console.log(definitions);
    return definitions;
  }
}

export function resolveComponent(value, definition = {}) {
  //console.log('resolveComponent');
  if (definition.component) return [definition.component, definition.props, definition.events];
  const types = definition.type ?? ['text'];
  const values = definition.values ?? [];
  const valueType = typeof value;
  switch (valueType) {
    case 'object':
      if (types.some(t => t === 'select' || t === 'selectobject')) {
        if (values.some(v => v['@id'] === value['@id'])) {
          return [InputSelect, { options: values }];
        }
      } else if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value)) {
        return primitiveComponents.datetime;
      }
      return entityComponent;
    case 'number': case 'bigint':
      return primitiveComponents.number;
    case 'boolean':
      return primitiveComponents.boolean;
    case 'string':
      /** @type {Array.<[number, object]>} */
      let components = [];
      let component;
      let p = 1;
      for (const t of types) {
        const type = t.toLowerCase();
        component = primitiveComponents[type];
        // use switch and a weight p to give different priorities 
        switch (type) {
          case 'value':
            components.push([p++, component]);
            break;
          case 'select': case 'selecturl':
            component = [InputSelect, { options: values }];
            components.push([p++, component]);
            if (values.includes(value)) return component;
            break;
          case 'time': case 'date': case 'datetime':
            components.push([p++, component]);
            if (!isNaN(dateTimeUtils[type].dateFrom(value))) return component;
            break;
          case 'url':
            components.push([p++, component]);
            if (isUri(value)) return component;
            break;
          case 'number':
            components.push([p++, component]);
            if (!isNaN(value)) return component;
            break;
          case 'text': case 'textarea':
          default:
            components.push([p++, component]);
        }
      }
      if (components.length) {
        return components.sort((a, b) => b[0] - a[0])[0][1];
      }
    default:
      return [];
  }
}

export function isPrimitive(type) {
  return primitiveTypes.has(type.toLowerCase());
}

/**
 * Get a component tuple [component, props, events] for a specific primitive type only
 * @param {string} type 
 * @param {object} props 
 */
export function getPrimitiveComponent(type, props = {}) {
  var t = type.toLowerCase();
  if (primitiveTypes.has(t)) {
    if (t in {select:0, selecturl:0, selectobject:0}) {
      if (!props.options && props.options.length) props.allowCreate = true;      
      return [InputSelect, props];
    } else {
      return primitiveComponents[t];
    }   
  }
  //return entityComponent;
}

export async function remoteSearch(type, query) {
  if (!lookupPromises[type]) return [];
  const lookup = await lookupPromises[type];
  //console.log(lookup);
  return lookup?.search({query}) || [];
}