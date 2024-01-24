import { ref, reactive, shallowReactive, isReactive, nextTick } from 'vue';
import { ROCrate } from 'ro-crate';
import { ElCheckbox } from 'element-plus';
import InputDateTime from '../components/InputDateTime.vue';
import InputGeo from '../components/InputGeo.vue';
import InputText from '../components/InputText.vue';
import InputSelect from '../components/InputSelect.vue';
import LinkEntity from '../components/LinkEntity.vue';
import dateTimeUtils from '../components/datetimeutils';
import lookupModules from '../lookups/index';

const entityComponent = [LinkEntity, { }];
const primitiveComponents = {
  boolean: [ElCheckbox, { border: true }, false],
  text: [InputText, { type: 'textarea' }, ''],
  textarea: [InputText, { type: 'textarea' }, ''],
  number: [InputText, { type: 'number' }, 0],
  url: [InputText, { type: 'url' }],
  time: [InputDateTime, { type: 'time' }],
  date: [InputDateTime, { type: 'date' }],
  datetime: [InputDateTime, { type: 'datetime' }],
  select: [InputSelect],
  selectobject: [InputSelect],
  selecturl: [InputSelect],
  value: [InputText, { type: 'text', disabled: true }]
};
//const primitiveTypes = new Set(Object.keys(primitiveComponents));
const stringTypesPriorities = {
  value: 1,
  select: 2,
  selecturl: 2,
  time: 3,
  date: 4,
  datetime: 5,
  url: 6,
  number: 7,
  text: 8,
  textarea: 8
};
const objectComponents = {
  geometry: [InputGeo, {}],
  geocoordinates: [InputGeo, {}],
  geoshape: [InputGeo, {}],
  geocoordinates$geoshape: [InputGeo, {}]
};

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
    props: { allowCreate: true },
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

export class EditorState {
  /** @type {ROCrate} */
  crate;
  /** cache data type info of each actual value of properties */
  meta;
  /** currently loaded profile */
  profile;
  /** cache of definition indexed by its type  */
  defByType;
  lookupPromises = {};
  /** cache array of entities */
  entities = ref({});
  metadataFileEntityId;
  rootDatasetId;

  constructor(opt) {
    this._showEntity = opt.showEntity;
  }

  async setCrate(rawCrate) {
    const crate = this.crate = new ROCrate(rawCrate, { array: true, link: true });
    this.metadataFileEntityId = crate.metadataFileEntity['@id'];
    this.rootDatasetId = crate.rootDataset['@id'];
    this.meta = reactive({});
    this.refreshEntities();
    await crate.resolveContext();
    return crate;
  }

  setProfile(profile) {
    this.profile = profile;
    this.meta = reactive({});
    this.defByType = {};
    // set select options for @type lookup
    jsonldKeywords['@type'].props.options = profile.enabledClasses;
    // async load lookup modules
    for (const type in profile.lookup) {
      const l = profile.lookup[type];
      const mod = l.module || "datapack";
      this.lookupPromises[type] = import(/* @vite-ignore */mod).catch((e) => { }).
        then(m => new (m?.default || lookupModules[mod])({ type, ...l })).
        catch(e => { });
    }
    return profile;
  }

  showEntity(e) {
    return this._showEntity(e);
  }

  refreshEntities() {
    const mid = this.metadataFileEntityId;
    this.entities.value = new Set(this.crate.entities({ filter: e => e['@id'] !== mid }));
  }

  async deleteEntity(e) {
    this.entities.value.delete(e);
    await nextTick();
    this.crate.deleteEntity(e, { references: true });
  }

  /**
   * Get property definitions based on type as defined in profile
   * @param {string[]} types One or more (combined) types associated with an entity
   */
  getProfileDefinitions(types = []) {
    const profile = this.profile;
    const defByType = this.defByType;
    const common = { ...jsonldKeywords };
    if (!profile) return {};
    if (!types.length) return common;
    const typesId = types.join('|');
    if (!defByType[typesId]) {
      let definitions = common;
      definitions['@id'].required = true;
      definitions['@id'].help = 'Unique ID.';
      definitions['@type'].required = true;
      definitions['@type'].help = 'The type of the entity.';
      const classes = types.map(t => profile.classes[t]).filter(e => e);
      for (const c of classes) {
        for (const input of (c.inputs || [])) {
          if (!definitions[input.id] || c.definition === 'override') {
            const { required, multiple, ...def } = input;
            def.min = required ? 1 : 0;
            def.max = multiple ? Infinity : 1;
            def.required = required;
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
  getDefinitions(entity = {}) {
    const types = entity['@type'];
    const definitions = { ...this.getProfileDefinitions(types) };
    const crate = this.crate;
    const properties = new Map(Object.keys(entity).map(name => [crate?.resolveTerm(name) || name, name]));

    // Find if a definition in profile has the same id already used in the data
    for (const id in definitions) {
      const def = definitions[id];
      const name = properties.get(id);
      if (name) {
        // if the name is different, use the name from the data
        if (def.name !== name) definitions[id] = { ...def, key: name };
        properties.delete(id);
      } else if (def.name in entity) {
        // The property name defined in profile exists in the data, but the resolved id is different.
        // Use the id instead of the name to access the property
        definitions[id] = { ...def, key: id };
      }
    }
    // Find existing properties in the entity data that are not yet included
    for (const [id, name] of properties) {
      // Add the resolved id to the definitions.
      definitions[id] = { id, name, key: name };
    }

    for (const name in entity['@reverse']) {
      const id = crate?.resolveTerm(name);
      if (entity['@id'] !== this.rootDatasetId || id !== "http://schema.org/about") {
        definitions[id] = {id, name, key: name, isReverse: true};
      }
    }
    //console.log(isReactive(definitions));
    //sort here
    return definitions;
  }

  resolveComponent(value, definition = {}) {
    // console.log(definition.id);
    //console.log(value, definition);
    if (definition.component) return [definition.component, definition.props, definition.events];
    const types = [].concat(definition.type||[]).map(t => t.toString().toLowerCase());
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
        } else if (value['@type']) {
          const c = objectComponents[value['@type'].join('$').toLowerCase()];
          if (c) return c;
        }
        return entityComponent;
      case 'number': case 'bigint':
        return primitiveComponents.number;
      case 'boolean':
        return primitiveComponents.boolean;
      case 'string':
        if (!types.length) types.push('text');
        types.sort((a, b) => (stringTypesPriorities[a] || 9) - (stringTypesPriorities[b] || 9));
        let component = primitiveComponents[types[0]] || primitiveComponents.textarea;
        for (const t of types) {
          switch (t) {
            case 'select': case 'selecturl':
              component = [InputSelect, { options: values }];
              if (values.includes(value)) return component;
              break;
            case 'time': case 'date': case 'datetime':
              if (!isNaN(dateTimeUtils[t].dateFrom(value))) return component;
              break;
            case 'url':
              if (isUri(value)) return component;
              break;
            case 'number':
              if (!isNaN(value)) return component;
              break;
          }
        }
        return component;
      default:
        return [];
    }
  }

  getComponents(entityId, defId) {
    const e = this.meta[entityId] ??= {};
    const c = e[defId] ??= shallowReactive([]);
    return c;
  }

  async remoteSearch(type, query) {
    if (!this.lookupPromises[type]) return [];
    const lookup = await this.lookupPromises[type];
    //console.log(lookup);
    return lookup?.search({ query }) || [];
  }

  isPrimitive(type) {
    return Array.isArray(type) ? false : type.toLowerCase() in primitiveComponents
  }

  isInline(type) {
    const t = (Array.isArray(type) ? type.join('$') : type).toLowerCase();
    return (t in primitiveComponents) || (t in objectComponents);
  }

  /**
   * Get a component tuple [component, props, events] for a specific primitive type only
   * @param {Array|string} type
   * @param {object} props
   */
  getInlineComponent(type, props = {}) {
    var t = (Array.isArray(type) ? type.join('$') : type).toLowerCase();
    if (t in primitiveComponents) {
      if (t in { select: 0, selecturl: 0, selectobject: 0 }) {
        if (!props.options || !props.options.length) props.allowCreate = true;
        return [InputSelect, props];
      } else {
        return primitiveComponents[t];
      }
    } else if (t in objectComponents) {
      return objectComponents[t];
    } else {
      return primitiveComponents.text;
    }
    //return entityComponent;
  }

  /**
   * Ensure that the term and its definition of the specified entity types exists in the jsonld context
   * @param {string[]} types
   */
  ensureContext(types) {
    if (types && Array.isArray(types)) {
      const context = {};
      for (const type of types) {
        const c = this.profile.classes[type];
        if (c) {
          if (c.id && !this.crate.getTerm(c.id)) {
            context[type] = c.id;
          }
          for (const prop of c.inputs) {
            if (prop.id && !this.crate.getTerm(prop.id)) {
              context[prop.name] = prop.id;
            }
          }
        }
      }
      if (Object.keys(context).length) {
        this.crate.addContext(context);
      }
    }
  }
  ensurePropertyContext(def) {
    if(def.name === '@type' || def.name === '@id') {
      return;
    }
    if (def.id && !this.crate.getTerm(def.id)) {
      const newDef = {};
      newDef[def.name] = def.id;
      this.crate.addContext(newDef);
    }
  }
}

