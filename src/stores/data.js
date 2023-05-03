import { ROCrate } from 'ro-crate';
import InputDateTime from '../components/InputDateTime.vue';
import InputGeo from '../components/InputGeo.vue';
import InputText from '../components/InputText.vue';
import InputSelect from '../components/InputSelect.vue';
import LinkEntity from '../components/LinkEntity.vue';
import dateTimeUtils from '../components/datetimeutils';

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
    component: InputText,
    min: 1
  }
  // '@value': {
  //   _component: [InputText],
  // }
};

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
  static profile;
  static defByType;
  static async setCrate(rawCrate) {
    this.crate = new ROCrate(rawCrate, { array: true, link: true });
    await this.crate.resolveContext();
  }

  static setProfile(profile) {
    this.profile = profile;
    this.defByType = {};
  }

  /**
   * Get property definitions based on type as defined in profile 
   * @param {string[]} types 
   */
  static getProfileDefinitions(types = []) {
    const profile = this.profile;
    const defByType = this.defByType;
    if (!profile) return {};
    if (!types.length) return jsonldKeywords;
    const typesId = types.join('|');
    if (!defByType[typesId]) {
      let definitions = { ...jsonldKeywords };
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
      undefinedProperties.delete(defId) || undefinedProperties.delete(definitions[defId].name);
    }
    // create definition for properties not defined in the profile inputs
    for (const [id, name] of undefinedProperties) {
      definitions[id] = { id, name };
      //console.log(id,name);
    }
    return definitions;
  }
}

export function resolveComponent(value, definition = {}) {
  if (definition.component) return [definition.component, definition.props];
  const types = definition.type ?? [];
  const values = definition.values ?? [];
  const valueType = typeof value;
  switch (valueType) {
    case 'object':
      if (types.some(t => t === 'select' || t === 'selectobject')) {
        if (values.some(v => v['@id'] === value['@id'])) {
          return [InputSelect, { options: values }];
        }
      } else if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value)) {
        return [InputDateTime, { type: 'datetime' }];
      }
      return [LinkEntity, {}];
    case 'number': case 'bigint':
      return [InputText, { type: 'number' }];
    case 'boolean':
      return ['el-checkbox', { border: true }];
    case 'string':
      /** @type {Array.<[number, object]>} */
      let components = [];
      let component;
      let p = 1;
      for (const t of types) {
        const type = t.toLowerCase();
        switch (type) {
          case 'select': case 'selecturl':
            component = [InputSelect, { options: values }];
            components.push([p++, component]);
            if (values.includes(value)) return component;
            break;
          case 'time': case 'date': case 'datetime':
            component = [InputDateTime, { type }];
            components.push([p++, component]);
            if (!isNaN(dateTimeUtils[type].dateFrom(value))) return component;
            break;
          case 'url':
            component = [InputText, { type }];
            components.push([p++, component]);
            if (isUri(value)) return component;
            break;
          case 'number':
            component = [InputText, { type }];
            components.push([p++, component]);
            if (!isNaN(value)) return component;
            break;
          case 'value':
            component = [InputText, { type: 'text', disabled: true }];
            components.push([p++, component]);
            break;
          case 'text': case 'textarea':
          default:
            components.push([p++, [InputText, { type: 'textarea' }]]);
        }
      }
      if (components.length) {
        return components.sort((a, b) => b[0] - a[0])[0][1];
      }
    default:
      return [];
  }
}
