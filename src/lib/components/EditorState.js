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

const entityComponent = [LinkEntity, {}];
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
  value: [InputText, { type: 'text', disabled: true }],
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
  textarea: 8,
};
const objectComponents = {
  geometry: [InputGeo, {}],
  geocoordinates: [InputGeo, {}],
  geoshape: [InputGeo, {}],
  geocoordinates$geoshape: [InputGeo, {}],
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
    max: 1,
  },
  '@type': {
    id: '@type',
    name: '@type',
    component: InputSelect,
    type: ['Select'],
    props: { allowCreate: true },
    min: 1,
  },
  // '@value': {
  //   _component: [InputText],
  // }
};

function isUri(value) {
  try {
    const u = new URL(value);
    return true;
  } catch (error) {
    return false;
  }
}

export class TypeDefinition {
  /** @type {string[]} */
  types = [];
  constructor(typeName) {
    this.types = [].concat(typeName);
  }
  get name() {
    return this.types.sort().join('$').toLowerCase();
  }
  get label() {
    return this.types.join('+');
  }
  get isInline() {
    const t = this.name;
    return t in primitiveComponents || t in objectComponents;
  }
  get isPrimitive() {
    return this.name in primitiveComponents;
  }
}

export class PropertyDefinition {
  /** @type {string} */
  id;
  /** @type {string} */
  name;
  /** @type {string} */
  _label;
  /** @type {string} */
  help;
  /** @type {string[]} */
  type;
  /** @type {number} */
  min;
  /** @type {number} */
  max;
  /** @type {boolean} */
  required;
  /** @type {TypeDefinition[]} */
  expectedTypes;

  constructor(classes, def) {
    const { required, multiple, type, ...fromMode } = def;
    Object.assign(this, fromMode);
    this.min = required ? 1 : 0;
    this.max = multiple ? Infinity : 1;
    this.required = required;
    let types = [].concat(type || []);
    if (types.length > 0) {
      // find and include all child types
      types = types
        .concat(types.flatMap((t) => classes[t]?.hasSubclass || []))
        .map((t) => JSON.stringify([].concat(t).sort())); // stringify to make comparable in a set
      types = Array.from(new Set(types)).map((t) => JSON.parse(t)); // filter for duplicates and convert back to object
    } else {
      types = ['Text', 'Number', 'Entity'];
    }
    this.expectedTypes = types.sort().map((t) => new TypeDefinition(t));
  }

  get label() {
    return this._label || this.name;
  }

  set label(val) {
    this._label = val;
  }
}

export class EditorState {
  /** @type {ROCrate} */
  crate;
  /** cache data type info of each actual value of properties */
  meta;
  /** currently loaded profile */
  profile;
  /**
   * cache of definition indexed by its type
   * @type {Object.<string, Object.<string, PropertyDefinition>>}
   */
  defByType;
  lookupPromises = {};
  /** cache array of entities @type {import('vue').Ref<Set<object>>} */
  entities = ref({});
  metadataFileEntityId;

  constructor(opt) {
    this._showEntity = opt?.showEntity;
  }

  async setCrate(rawCrate) {
    const crate = (this.crate = new ROCrate(rawCrate, { array: true, link: true }));
    this.metadataFileEntityId = crate.metadataFileEntity['@id'];
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
      const mod = l.module || 'datapack';
      this.lookupPromises[type] = import(/* @vite-ignore */ mod)
        .catch((e) => {})
        .then((m) => new (m?.default || lookupModules[mod])({ type, ...l }))
        .catch((e) => {});
    }
    return profile;
  }

  showEntity(id) {
    if (this._showEntity) return this._showEntity(id);
  }

  refreshEntities() {
    const mid = this.metadataFileEntityId;
    this.entities.value = new Set(this.crate.entities({ filter: (e) => e['@id'] !== mid }));
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
      const definitions = common;
      definitions['@id'].required = true;
      definitions['@id'].help =
        'Persistent, managed unique ID in URL format (if available), for example a DOI for a collection or an ORCID, personal home page URL or email address for a person';
      definitions['@type'].required = true;
      definitions['@type'].help = 'The type of the entity.';
      const classes = types.map((t) => profile.classes[t]).filter((e) => e);
      for (const c of classes) {
        for (const input of c.inputs || []) {
          if (!definitions[input.id] || c.definition === 'override') {
            definitions[input.id] = new PropertyDefinition(profile.classes, input);
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
    const properties = new Map(Object.keys(entity).map((name) => [crate?.resolveTerm(name) || name, name]));

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
      definitions[id] = { id, name, key: name, isReverse: true };
    }
    if (entity['@id'] === this.crate.rootId) {
      definitions['http://schema.org/about'] = null;
    }
    //console.log(isReactive(definitions));
    //sort here
    return definitions;
  }

  resolveComponent(value, definition = {}) {
    // console.log(definition.id);
    //console.log(value, definition);
    if (definition.component) return [definition.component, definition.props, definition.events];
    const types = [].concat(definition.type || []).map((t) => t.toString().toLowerCase());
    const values = definition.values ?? [];
    const valueType = typeof value;
    switch (valueType) {
      case 'object':
        if (types.some((t) => t === 'select' || t === 'selectobject')) {
          if (values.some((v) => v['@id'] === value['@id'])) {
            return [InputSelect, { options: values }];
          }
        } else if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value)) {
          return primitiveComponents.datetime;
        } else if (value['@type']) {
          const c = objectComponents[value['@type'].join('$').toLowerCase()];
          if (c) return c;
        }
        return entityComponent;
      case 'number':
      case 'bigint':
        return primitiveComponents.number;
      case 'boolean':
        return primitiveComponents.boolean;
      case 'string':
        if (!types.length) types.push('text');
        types.sort((a, b) => (stringTypesPriorities[a] || 9) - (stringTypesPriorities[b] || 9));
        let component = primitiveComponents[types[0]] || primitiveComponents.textarea;
        for (const t of types) {
          switch (t) {
            case 'select':
            case 'selecturl':
              component = [InputSelect, { options: values }];
              if (values.includes(value)) return component;
              break;
            case 'time':
            case 'date':
            case 'datetime':
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
    const e = (this.meta[entityId] ??= {});
    const c = (e[defId] ??= shallowReactive([]));
    return c;
  }

  localSearch(types, query) {
    // local search
    const qRegex = new RegExp(query, 'i');
    const it = this.crate.entities({
      filter: (e) =>
        e['@id'] !== this.metadataFileEntityId &&
        types.every((t) => e['@type'].includes(t)) &&
        (e.name ?? []).concat(e['@id']).some((v) => qRegex.test(v)),
    });
    return Array.from(it);
  }

  async remoteSearch(types, query) {
    const type = types.join('$');
    if (!this.lookupPromises[type]) return [];
    const lookup = await this.lookupPromises[type];
    //console.log(lookup);
    return lookup?.search({ query }) || [];
  }

  isPrimitive(type) {
    return Array.isArray(type) ? false : type.toLowerCase() in primitiveComponents;
  }

  isInline(type) {
    const t = (Array.isArray(type) ? type.join('$') : type).toLowerCase();
    return t in primitiveComponents || t in objectComponents;
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
      for (const type of types) {
        const c = this.profile.classes[type];
        if (c) {
          this.ensureContextHasTerm({ id: c.id, name: type });
          for (const prop of c.inputs) {
            this.ensureContextHasTerm({ id: prop.id, name: prop.name });
          }
        }
      }
    }
  }

  ensureContextHasTerm({ id, name }) {
    //console.log(JSON.stringify(this.crate.__context))
    //console.log(id, name);
    if (name === '@type' || name === '@id') {
      return;
    }
    if (id && !this.crate.getTerm(id)) {
      this.crate.addTermDefinition(name, id);
    }
    //console.log(JSON.stringify(this.crate.__context))
  }
}
