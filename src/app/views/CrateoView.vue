<script setup>
import { shallowReactive, ref, computed, nextTick } from 'vue';
import { maspProfilesPromise } from '../utils/maspProfiles.js';
import About from "../components/About.vue";
import Help from "../components/Help.vue";
import SpreadSheet from "../components/SpreadSheet.vue";
import { ROCrate } from "ro-crate";
import {
  ElRow, ElCol, ElMenu, ElMenuItem, ElDivider, ElSelectV2, ElOption,
  ElDialog, ElButton, ElCollapse, ElCollapseItem, ElAlert, ElNotification
} from 'element-plus';
import { handleRoute } from '../../lib/DefaultRouteHandler.js';
import { CrateEditor, cacheLabel } from '../../lib';
import { Preview } from 'ro-crate-html';
import { roCrateToJSON } from 'ro-crate-html-lite/lib/preview.js';

import renderTemplate from 'virtual:ejs';
import renderTemplateLite from 'virtual:nunjucks-template';

const navigate = handleRoute((entityId, propertyId) => {
  if (data.metadataHandle) {
    console.log('handleRoute, set entityId', entityId)
    data.entityId = entityId;
    data.propertyId = propertyId;
  }
});
//const $router = useRouter();

const emit = defineEmits(['load:spreadsheet']);
const defaultProfileName = 'RO-Crate + Schema.org Profile';

const profileDebugEnabled = (() => {
  if (typeof window === 'undefined') return false;
  return window.localStorage?.getItem('crateOProfileDebug') !== '0';
})();

const hiddenProfileNames = new Set(['RO-Crate Machine Actionable Profile']);

function profileDebug(...args) {
  if (!profileDebugEnabled) return;
  console.log('[crate-o:profile]', ...args);
}

function profileMeta(profile) {
  return profile?.getProfileMetadata ? profile.getProfileMetadata() : (profile?.metadata || {});
}

const data = shallowReactive({
  /** @type {?FileSystemDirectoryHandle} */
  dirHandle: null,
  /** @type {?FileSystemFileHandle} */
  metadataHandle: null,
  crate: null,
  entityId: '',
  propertyId: '',
  selectedProfile: null,
  selectedProfileSource: 'none',
  profilePickerInteracted: false,
  profileLoading: false,
  profileLoadingName: '',
  profiles: [],
  spreadSheetBuffer: null,
  autoDetectedProfileKey: null,
  loading: false,
  modeError: [],
  validationResult: {},
  showDialog: false,
  dialogTitle: '',
  dialogContent: null,
  validationResultDialog: false,
  validationSuccessBanner: '',
  showSettingsDialog: false,
  settings: {
    previewGenerator: 'full' // 'lite' or 'full'
  }
});
window.data = data;
const profile = computed(() => data.profiles.find((p) => {
  const name = profileMeta(p).name;
  return name === data.selectedProfile && !hiddenProfileNames.has(name);
}));
const profileOptions = computed(() => data.profiles.flatMap((p) => {
  const metadata = profileMeta(p);
  if (hiddenProfileNames.has(metadata.name)) {
    return [];
  }
  return p ? [{ value: metadata.name, label: metadata.name, description: metadata.description }] : [];
}));

const metadataDescriptorRuleIds = computed(() => {
  const flags = data.validationResult?.ruleFlags || {};
  return new Set(
    Object.entries(flags)
      .filter(([, meta]) => meta?.metadataDescriptorRule)
      .map(([ruleId]) => ruleId)
  );
});

const validationDetailItems = computed(() => {
  const rules = data.validationResult?.rules || {};
  const items = [];

  const withPropertyErrorFallbackReason = (level, message) => {
    const msg = message || '';
    if (level !== 'property-errors') {
      return msg;
    }
    const isLegacyPropertyError = /^Property "[^"]+" validation failed for entity /.test(msg);
    const hasReasonSuffix = /\([^)]*\)\s*$/.test(msg);
    if (isLegacyPropertyError && !hasReasonSuffix) {
      return `${msg} (legacy validator message: no reason provided)`;
    }
    return msg;
  };
  const extractPropertyName = (message) => {
    const match = /^Property "([^"]+)" validation (?:failed|succeeded) for entity /.exec(message || '');
    return match?.[1] || null;
  };

  for (const [ruleId, entities] of Object.entries(rules)) {
    for (const [entityId, levels] of Object.entries(entities || {})) {
      for (const [level, messages] of Object.entries(levels || {})) {
        for (const message of messages || []) {
          items.push({
            ruleId,
            entityId,
            level,
            message: withPropertyErrorFallbackReason(level, message?.message || ''),
          });
        }
      }
    }
  }

  const propertyReasonByKey = new Map(
    items
      .filter((item) => item.level === 'info')
      .map((item) => {
        const match = /^Property "([^"]+)":\s*(.+)$/.exec(item.message || '');
        if (!match) {
          return null;
        }
        const [, propName, reason] = match;
        return [`${item.ruleId}::${item.entityId}::${propName}`, reason];
      })
      .filter(Boolean)
  );

  const enrichedItems = items.map((item) => {
    if (item.level !== 'property-errors') {
      return item;
    }

    const propName = extractPropertyName(item.message);
    if (!propName) {
      return item;
    }

    const hasReasonSuffix = /\([^)]*\)\s*$/.test(item.message || '');
    if (hasReasonSuffix) {
      return item;
    }

    const reason = propertyReasonByKey.get(`${item.ruleId}::${item.entityId}::${propName}`);
    if (reason) {
      return {
        ...item,
        message: `${item.message} (${reason})`,
      };
    }

    return item;
  });

  const failureLevels = new Set(['error', 'property-errors', 'warning', 'info']);

  // Suppress non-significant candidate matches where a fixed-value identity check failed
  // (e.g. candidate entity considered for RO-Crate Metadata Descriptor but @id mismatch).
  const suppressedRuleEntityPairs = new Set(
    enrichedItems
      .filter((item) =>
        item.level === 'info' &&
        typeof item.message === 'string' &&
        item.message.includes('does not match expected fixed value')
      )
      .map((item) => `${item.ruleId}::${item.entityId}`)
  );

  // If a property succeeds somewhere for a rule, hide unmatched candidate failures
  // for that same property/rule pair.
  const succeededPropertyKeys = new Set(
    enrichedItems
      .filter((item) => item.level === 'property-success')
      .map((item) => {
        const prop = extractPropertyName(item.message);
        return prop ? `${item.ruleId}::${item.entityId}::${prop}` : null;
      })
      .filter(Boolean)
  );

  const filtered = enrichedItems.filter((item) => {
    if (!failureLevels.has(item.level)) {
      return false;
    }

    if (metadataDescriptorRuleIds.value.has(item.ruleId)) {
      return false;
    }

    // Fallback for older validator bundles that don't return ruleFlags yet.
    // Suppress RO-Crate metadata descriptor candidate-match noise.
    const isMetadataDescriptorRule =
      typeof item.ruleId === 'string' && item.ruleId.includes('RO-Crate_Metadata_Descriptor');
    const isMetadataDescriptorPropertyNoise =
      item.level === 'property-errors' &&
      (item.message.startsWith('Property "about" validation failed') ||
        item.message.startsWith('Property "@id" validation failed'));
    if (isMetadataDescriptorRule && isMetadataDescriptorPropertyNoise) {
      return false;
    }

    if (suppressedRuleEntityPairs.has(`${item.ruleId}::${item.entityId}`)) {
      return false;
    }

    if (item.level === 'property-errors') {
      const prop = extractPropertyName(item.message);
      if (prop && succeededPropertyKeys.has(`${item.ruleId}::${item.entityId}::${prop}`)) {
        return false;
      }
    }

    return true;
  });

  const severityOrder = {
    error: 0,
    'property-errors': 1,
    warning: 2,
    info: 3,
  };

  return filtered.sort((left, right) => {
    const leftOrder = severityOrder[left.level] ?? 99;
    const rightOrder = severityOrder[right.level] ?? 99;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    if (left.entityId !== right.entityId) {
      return left.entityId.localeCompare(right.entityId);
    }

    return left.ruleId.localeCompare(right.ruleId);
  });
});

const validationErrorSummary = computed(() => {
  const summary = {};
  for (const item of validationDetailItems.value) {
    if (!summary[item.message]) {
      summary[item.message] = { count: 0, entities: new Set() };
    }
    summary[item.message].count++;
    summary[item.message].entities.add(item.entityId);
  }
  return Object.entries(summary)
    .map(([message, data]) => ({ 
      message, 
      count: data.count,
      entities: Array.from(data.entities).sort()
    }))
    .sort((a, b) => b.count - a.count);
});

//const editor = ref();
const editor = { crate: {}, refresh: () => { } };

const commands = {
  loadProfile() {
    data.showDialog = true;
    data.dialogContent = null;
    data.dialogTitle = 'Local MASP profiles only';
    data.modeError = [{ message: 'This build loads MASP profile-crates from the local ro-crate-masp workspace only.' }];
  },

  async open() {
    console.log('open');
    try {
      data.dirHandle = await window.showDirectoryPicker();
      data.loading = true;
      try {
        data.metadataHandle = null;
        data.metadataHandle = await data.dirHandle.getFileHandle('ro-crate-metadata.json');
      } catch (error) {
        try {
          data.metadataHandle = await data.dirHandle.getFileHandle('ro-crate-metadata.jsonld');
        } catch (error) {
          //No metadataHandle found start a new Crate
        }
      }
      let crate = {};
      if (data.metadataHandle) {
        let file = await data.metadataHandle.getFile();
        const content = await file.text();
        crate = JSON.parse(content);
      }
      const profiles = await maspProfilesPromise;
      data.profiles = shallowReactive(profiles)
      //console.log(crate);
      data.crate = crate;
      console.log(data.crate);
      //navigate();
      //data.loading = false;
      // reset crate
      resetData();
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error(error);
        window.alert(error);
      }
    }
    console.log('end open')
  },

  async addFiles() {
    const dirHandle = data.dirHandle;
    const files = await collectFiles({ dirHandle, root: '' });
    editor.crate.setProperty(editor.crate.rootId, 'hasPart', files);
    editor.refresh();
  },

  async save() {
    console.log('save start');
    if (data.dirHandle) {
      if (!(await ensureDirectoryAccess())) {
        return;
      }
      // create new crate metadata
      data.metadataHandle = await data.dirHandle.getFileHandle('ro-crate-metadata.json', { create: true });
    } else {
      try {
        data.metadataHandle = await window.showSaveFilePicker({
          suggestedName: 'ro-crate-metadata.json',
          types: [{
            description: 'RO-Crate Metadata File',
            accept: { 'application/json': ['.json'] }
          }]
        });
      } catch (error) {
      }
    }
    if (data.metadataHandle) {
      if (!profile.value?.validateCrate) {
        ElNotification({
          title: 'No Profile Validator',
          message: 'Select a profile after opening the directory, then save again to run validation.',
          type: 'warning',
          duration: 5000,
        });
      }
      const rawCrate = editor.crate.toJSON();
      let writable = await data.metadataHandle.createWritable();
      let content = JSON.stringify(rawCrate, null, 2);
      await writable.write(content);
      await writable.close();
      //data.crate = crate;
      //data.entityId = '';
      data.validationResult = await validate(rawCrate, profile.value);
      console.log(data.validationResult);
      const hasValidationWarnings = hasValidationMessages(
        data.validationResult,
        validationDetailItems.value.length
      );
      data.validationResultDialog = hasValidationWarnings;
      const selectedProfileName = profileMeta(profile.value).name || data.selectedProfile;
      const saveNotificationTitle = selectedProfileName
        ? `Saved - Validated with "${selectedProfileName}"`
        : 'Saved - Validated';
      data.validationSuccessBanner = hasValidationWarnings ? '' : saveNotificationTitle;
      ElNotification({ title: saveNotificationTitle, type: 'success', duration: 3000 });

      // save preview
      const crate = new ROCrate(rawCrate, { array: true, link: true });
      await crate.resolveContext();

      if(data.settings.previewGenerator === 'full') {
        // using ro-crate-html
        const preview = new Preview(crate);
        content = renderTemplate(preview.templateParams());
      } else {
          // using ro-crate-html-lite
        const templateData = await roCrateToJSON(crate);
        content = renderTemplateLite(templateData);
      }
      const previewHandle = await data.dirHandle.getFileHandle('ro-crate-preview.html', { create: true });
      writable = await previewHandle.createWritable();
      await writable.write(content);
      await writable.close();
      
      ElNotification({ title: 'Saved preview in ro-crate-preview.html', type: 'success', duration: 3000 });

    }
  },

  close() {
    data.dirHandle = null;
    data.metadataHandle = null;
    data.crate = null;
    resetData();
    navigate();
  },

  async loadSpreadsheet() {

    const [excelHandle] = await window.showOpenFilePicker({
      types: [{
        description: 'Excel File with RO-Crate columns',
        accept: { 'application/vnd.ms-excel': ['.xlsx'] }
      }]
    });
    let file = await excelHandle.getFile();
    const buffer = await file.arrayBuffer();
    data.crate = editor.crate;
    data.spreadSheetBuffer = buffer;
  },

  help() {
    data.dialogTitle = 'Help';
    data.dialogContent = Help;
    data.showDialog = true;
  },
  about() {
    data.dialogTitle = 'About';
    data.dialogContent = About;
    data.showDialog = true;
  },
  settings() {
    data.showSettingsDialog = true;
  }
};

const excludedFiles = {
  'ro-crate-metadata.json': '',
  'node_modules': ''
};

function resetData() {
  data.entityId = '';
  //data.selectedProfile = defaultProfile;
  //data.profiles = shallowReactive(profiles);
  data.selectedProfile = null;
  data.selectedProfileSource = 'none';
  data.profilePickerInteracted = false;
  data.spreadSheetBuffer = null;
  data.autoDetectedProfileKey = null;
  data.validationResultDialog = false;
  data.validationSuccessBanner = '';
  data.validationResult = {};
  data.loading = false;
}

function updateEntityId(id, pages) {
  console.log('updateEntityId', id);
  navigate(id, '', pages);
}

/**
 *
 * @param {object} param0
 * @param {FileSystemDirectoryHandle} param0.dirHandle
 * @param {string} param0.root
 */
async function collectFiles({ dirHandle, root }) {
  const files = [];
  /** @type {[string, FileSystemFileHandle|FileSystemDirectoryHandle][]} */
  const stack = [[root, dirHandle]];
  /** @type {[string, FileSystemFileHandle|FileSystemDirectoryHandle]} */
  var entry;
  while ((entry = stack.pop())) {
    let [name, handle] = entry;
    if (handle.kind === 'directory') {
      if (name) name += '/'
      const entries = [];
      for await (const entry of handle.entries()) {
        entries.push(entry);
      }
      for (var i = entries.length; i--;) {
        const e = entries[i];
        if (!e[0].startsWith('.') && !(e[0] in excludedFiles)) {
          e[0] = name + e[0];
          stack.push(e);
        }
      }
    } else {
      files.push({ "@id": name, "@type": "File" });
    }
  }
  return files;
}

async function ensureDirectoryAccess() {
  if (!data.dirHandle) {
    return false;
  }

  try {
    const current = await data.dirHandle.queryPermission({ mode: 'readwrite' });
    if (current === 'granted') {
      return true;
    }

    if (current === 'prompt') {
      const requested = await data.dirHandle.requestPermission({ mode: 'readwrite' });
      if (requested === 'granted') {
        return true;
      }
    }
  } catch (error) {
    console.error('Failed to verify directory permission', error);
  }

  ElNotification({
    title: 'Directory Access Required',
    message: 'Please click Open Directory and re-select your folder for this browser session/port.',
    type: 'warning',
    duration: 5000,
  });

  data.metadataHandle = null;
  return false;
}

function hasValidationMessages(result, visibleDetailCount = 0) {
  if (visibleDetailCount > 0) {
    return true;
  }

  return Array.isArray(result?.error) && result.error.length > 0;
}

const validate = async function (json, profile) {
  if (!profile?.validateCrate) {
    return { error: [] };
  }
  const crate = new ROCrate(json, { array: true, link: true });
  await crate.resolveContext();
  return profile.validateCrate(crate);
}

const goTo = function ({ id, prop }) {
  if (data.entityId !== id || prop) {
    navigate(id, prop);
    // Close the validation alert and scroll the editor into view after navigation
    nextTick(() => {
      data.validationResultDialog = false;
      const editorElement = document.querySelector('.editor-wrapper, [role="tablist"]');
      if (editorElement) {
        editorElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
}

function saveSettings() {
  localStorage.setItem('crateOSettings', JSON.stringify(data.settings));
  ElNotification({ title: 'Settings saved', type: 'success', duration: 2000 });
}

function loadSettings() {
  const saved = localStorage.getItem('crateOSettings');
  if (saved) {
    try {
      data.settings = Object.assign(data.settings, JSON.parse(saved));
    } catch (e) {
      console.error('Failed to load settings', e);
    }
  }
}

var prevObjectUrl;
async function getFile(id) {
  try {
    if (!(await ensureDirectoryAccess())) {
      return null;
    }
    const paths = id.split('/');
    const fileName = paths.pop();
    let dirHandle = data.dirHandle;
    for (let p of paths) {
      dirHandle = await dirHandle.getDirectoryHandle(p);
    }
    const fileHandle = await dirHandle.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    return {
      id,
      type: file.type,
      name: file.name,
      get url() {
        if (prevObjectUrl) {
          URL.revokeObjectURL(prevObjectUrl);
        }
        prevObjectUrl = URL.createObjectURL(file);
        return prevObjectUrl;
      },
      async text() {
        return file.text();
      }
    }
  } catch (e) {
    console.error(e);
    if (e?.name === 'NotAllowedError') {
      ElNotification({
        title: 'Directory Access Required',
        message: 'Permission was lost for this directory. Use Open Directory to re-authorize access.',
        type: 'warning',
        duration: 5000,
      });
    }
  }
}

async function detectProfile(roc) {
  if (data.selectedProfileSource === 'user' && data.selectedProfile) {
    profileDebug('detectProfileSkippedForUserSelection', {
      selectedProfileName: data.selectedProfile
    });
    return false;
  }

  const conformsToCrate = roc.rootDataset['conformsTo'] || [];

  let matchedProfile = null;
  for (const p of data.profiles) {
    let conformsToProfile = p?.getConformsToUris?.() || [];
    if (conformsToProfile.length === 0 && p?.ensureLoaded) {
      try {
        await p.ensureLoaded();
      } catch (error) {
        profileDebug('ensureLoadedFailed', { name: profileMeta(p).name, message: error?.message });
      }
      conformsToProfile = p?.getConformsToUris?.() || [];
    }

    if (conformsToCrate.some(ct => conformsToProfile.includes(ct['@id']))) {
      matchedProfile = p;
      break;
    }
  }

  let matchedByConformsTo = false;
  if (matchedProfile) {
    data.selectedProfile = profileMeta(matchedProfile).name;
    data.selectedProfileSource = 'auto-conformsTo';
    matchedByConformsTo = true;
  }

  profileDebug('detectProfile', {
    conformsToCrate: conformsToCrate.map((ct) => ct?.['@id']).filter(Boolean),
    matchedByConformsToName: matchedProfile ? profileMeta(matchedProfile).name : null,
    autoSelected: !!matchedProfile,
    finalSelectedProfileName: data.selectedProfile,
    availableProfiles: data.profiles.map((p) => ({
      name: profileMeta(p).name,
      conformsTo: p?.getConformsToUris?.() || []
    }))
  });

  return matchedByConformsTo;
}

function getCrateProfileKey(roc) {
  const rootId = roc?.rootDataset?.['@id'] || '';
  const conformsTo = (roc?.rootDataset?.['conformsTo'] || [])
    .map((ct) => ct?.['@id'])
    .filter(Boolean)
    .sort()
    .join('|');
  return `${rootId}::${conformsTo}`;
}

/**
 * 
 * @param {ROCrate} roc 
 * @param {function} refresh 
 */
async function ready(roc, refresh) {
  const crateProfileKey = getCrateProfileKey(roc);
  const shouldAutoDetect = data.selectedProfileSource !== 'user';
  const matchedByConformsTo = shouldAutoDetect ? await detectProfile(roc) : false;
  if (!matchedByConformsTo && shouldAutoDetect) {
    data.selectedProfile = defaultProfileName;
    data.selectedProfileSource = 'auto-default';
  }
  data.autoDetectedProfileKey = crateProfileKey;
  profileDebug('readyProfileResolution', {
    crateProfileKey,
    matchedByConformsTo,
    selectedProfileName: data.selectedProfile,
    resolvedProfileName: profileMeta(profile.value).name,
    selectedProfileSource: data.selectedProfileSource
  });

  data.loading = false;
  console.log('ready');
  editor.crate = roc;
  editor.refresh = refresh;
  // console.log(data.profiles[data.selectedProfile])
  //roc.compactProperties({});
}

const activeNames = ref(['1']);

import { onMounted, watch } from 'vue';

function handleProfileVisibilityChange(visible) {
  if (visible) {
    data.profilePickerInteracted = true;
  }
}

function handleProfileChange() {
  if (data.profilePickerInteracted && data.selectedProfile !== null && data.selectedProfile !== undefined) {
    data.selectedProfileSource = 'user';
    data.profilePickerInteracted = false;
  }
}

// Load settings on mount
onMounted(() => {
  loadSettings();
  maspProfilesPromise.then((profiles) => {
    data.profiles = shallowReactive(profiles);
    profileDebug('profilesPreloadedOnMount', (profiles || []).map((p, index) => ({
      index,
      name: profileMeta(p).name,
      groupCount: (p?.getPropertyGroups?.() || []).length
    })));
  }).catch((error) => {
    console.error('Failed to preload MASP profiles', error);
  });
});

// Watch for changes in selectedProfile and update localStorage
watch(() => data.selectedProfile, () => {
  localStorage.setItem('selectedProfileName', data.selectedProfile || '');
  if (profile.value?.ensureLoaded) {
    data.profileLoading = true;
    data.profileLoadingName = data.selectedProfile || '';
    profile.value.ensureLoaded()
      .then(() => {
        data.profileLoading = false;
        data.profileLoadingName = '';
      })
      .catch((error) => {
        data.profileLoading = false;
        data.profileLoadingName = '';
        console.error('Failed to load selected profile', error);
      });
  }
  const groups = (profile.value?.getPropertyGroups?.() || []).map((g) => g?.name).filter(Boolean);
  profileDebug('selectedProfileChanged', {
    selectedProfileName: data.selectedProfile,
    resolvedProfileName: profileMeta(profile.value).name,
    selectedProfileSource: data.selectedProfileSource,
    selectedProfileGroups: groups,
    selectedProfileConformsTo: profile.value?.getConformsToUris?.() || []
  });
});

watch(() => data.profiles, (profiles) => {
  if (hiddenProfileNames.has(data.selectedProfile)) {
    data.selectedProfile = null;
    data.selectedProfileSource = 'none';
  }
  profileDebug('profilesHydratedInView', (profiles || []).map((p, index) => {
    const meta = profileMeta(p);
    const groups = (p?.getPropertyGroups?.() || []).map((g) => g?.name).filter(Boolean);
    return {
      index,
      name: meta.name,
      groupCount: groups.length,
      groups
    };
  }));
});

</script>

<template>
  <div class="bg-slate-200" v-loading.fullscreen="data.loading">
    <el-menu default-active="-1" class="" background-color="#ecf5ff" text-color="#000" mode="horizontal"
      @select="(key) => commands[key]()">
      <el-menu-item index="open">
        📂 Open Directory
      </el-menu-item>
      <el-menu-item index="addFiles" :disabled="!data.dirHandle">
        🗃️ Load Files
      </el-menu-item>
      <el-menu-item index="loadSpreadsheet" :disabled="!data.dirHandle">
        🗄️ Bulk Add
      </el-menu-item>
      <el-menu-item index="save" :disabled="!data.dirHandle">
        💾 Save
      </el-menu-item>
      <el-menu-item index="settings" :disabled="!data.dirHandle">
        ⚙️ Settings
      </el-menu-item>
      <el-menu-item index="close" :disabled="!data.dirHandle">
        ❌ Close
      </el-menu-item>
      <el-menu-item index="help" title="Help">
        ❓ Help
      </el-menu-item>
      <el-menu-item index="about" title="About">
        🛈 About
      </el-menu-item>

    </el-menu>
    <el-row class="text-large py-3">
      <el-col :sm="24" :md="18" class="pl-3">
        <el-select-v2 v-model="data.selectedProfile" @change="handleProfileChange" @visible-change="handleProfileVisibilityChange" class="w-[30em]" :disabled="!data.dirHandle" scrollbar-always-on
          placeholder="Open a directory first to select a mode" :options="profileOptions" :height="290"
          :item-height="58">
          <template #prefix>
            <span class="font-bold">Profile:</span>
          </template>
          <template #footer>
            <el-button size="small" @click="commands.loadProfile()">Load and add a new mode from your computer
              ...</el-button>
          </template>
          <template #default="{ item }">
            <div class="border-b-1 mb-2" v-if="item" :title="item.description">
              <p>{{ item.label }}</p>
              <p class="text-slate-500 text-xs truncate">{{ item.description }}</p>
            </div>
          </template>
        </el-select-v2>
      </el-col>
      <el-col v-if="data.dirHandle" :sm="24" :md="6" class="content-center pl-3">
        <span class="font-bold text-slate-500">Selected Directory: </span>
        <span class="truncate" :title="data.dirHandle.name">{{ data.dirHandle.name }}</span>
      </el-col>
      <el-col v-if="data.profileLoading" :sm="24" :md="24" class="pl-3 pt-1">
        <span class="text-sm text-slate-500">Loading profile{{ data.profileLoadingName ? ` \"${data.profileLoadingName}\"` : '' }}...</span>
      </el-col>
    </el-row>
  </div>
  <template v-if="data.crate">
    <el-alert class="validation-warnings" v-if="data.validationResultDialog" type="warning"
      @close="data.validationResultDialog = false">
      <el-collapse class="ml-5 mr-10 min-w-96" role="alert">
        <el-collapse-item title="Saved with warnings" name="validation-warnings">
          <div class="p-2" v-for="result in data.validationResult.error" :key="`${result.rule}-${result.entity}`">
            <p>Entity:
              <el-button size="small" type="default" @click="goTo({ id: result.entity })">{{ result.entity }}</el-button>
            </p>
            <p class="ml-5 py-1 text-red-700">{{ result.message }}</p>
          </div>
        </el-collapse-item>
        <el-collapse-item v-if="validationErrorSummary.length" :title="`Error Summary (${validationDetailItems.length} total)`"
          name="error-summary">
          <div class="p-3 border-b border-slate-200" v-for="(summary, idx) in validationErrorSummary" :key="idx">
            <p class="font-semibold text-slate-900 mb-2">{{ summary.count }}× {{ summary.message }}</p>
            <div class="flex flex-wrap gap-1">
              <el-button 
                v-for="entityId in summary.entities" 
                :key="entityId"
                size="small" 
                type="primary" 
                link
                @click="goTo({ id: entityId })">
                {{ entityId }}
              </el-button>
            </div>
          </div>
        </el-collapse-item>
        <el-collapse-item v-if="validationDetailItems.length" :title="`Validation details (${validationDetailItems.length})`"
          name="validation-details">
          <div class="p-2 border-b border-slate-200" v-for="detail in validationDetailItems"
            :key="`${detail.ruleId}-${detail.entityId}-${detail.level}-${detail.message}`">
            <p>
              Entity:
              <el-button size="small" type="default" @click="goTo({ id: detail.entityId })">{{ detail.entityId }}</el-button>
            </p>
            <p class="ml-5 py-1 text-slate-700">
              <span class="font-semibold uppercase text-xs mr-2">{{ detail.level }}</span>
              <span class="font-mono text-xs mr-2">{{ detail.ruleId }}</span>
              <span>{{ detail.message }}</span>
            </p>
          </div>
        </el-collapse-item>
      </el-collapse>
    </el-alert>
    <el-alert
      class="validation-warnings"
      v-else-if="data.validationSuccessBanner"
      type="success"
      :title="data.validationSuccessBanner"
      show-icon
      @close="data.validationSuccessBanner = ''"
    />
    <!-- <strong class="block sm:inline font-bold">Saved with warnings</strong> -->
    <!-- <span class="absolute top-0 bottom-0 right-0 px-4 py-3">
        <el-button type="text" @click="data.validationResultDialog = false">
          <svg class="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20">
            <title>Close</title>
            <path
              d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
          </svg>
        </el-button>
      </span> -->
    <CrateEditor :key="`profile-${data.selectedProfile}`" :crate="data.crate" :mode="profile" :entity-id="data.entityId" :property-id="data.propertyId"
      :load-file="getFile" @update:entity-id="updateEntityId" @ready="ready">
    </CrateEditor>
    <SpreadSheet v-model:crate="data.crate" :buffer="data.spreadSheetBuffer" />
  </template>
  <div v-else>
    <div class="p-5 lg:p-20 lg:max-w-[75%]">
      <about />
      <help />
    </div>
  </div>

  <el-dialog v-model="data.showDialog" :title="data.dialogTitle" width="800" align-center>
    <div class="dialog-content">
      <component v-if="data.dialogContent" :is="data.dialogContent" />
      <template v-else-if="data.modeError">
        <el-divider />
        <div class="p-2" v-for="error of data.modeError">
          <p>{{ error.instancePath }}</p>
          <p>{{ error.message }}</p>
          <el-divider />
        </div>
      </template>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" @click="data.showDialog = false">Close</el-button>
      </span>
    </template>
  </el-dialog>
  <el-dialog v-model="data.showSettingsDialog" title="Settings" width="600" align-center>
    <div class="dialog-content">
      <div class="p-4">
        <div class="mb-4"> 
          <p class="font-semibold mb-3">RO-Crate HTML Preview Generator</p>
          <label class="flex items-center cursor-pointer mb-3">
            <input type="radio" v-model="data.settings.previewGenerator" value="lite" name="previewGenerator" class="mr-2" />
            <div>
              <span class="font-semibold">Lite Preview (ro-crate-html-lite) - beta version</span>
              <p class="text-sm text-slate-500">Built without any dependence on online resources</p>
            </div>
          </label>
          <label class="flex items-center cursor-pointer">
            <input type="radio" v-model="data.settings.previewGenerator" value="full" name="previewGenerator" class="mr-2" />
            <div>
              <span class="font-semibold">Full Preview (ro-crate-html)</span>
              <p class="text-sm text-slate-500">More comprehensive, includes additional features</p>
            </div>
          </label>
        </div>
      </div>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="data.showSettingsDialog = false">Cancel</el-button>
        <el-button type="primary" @click="saveSettings(); data.showSettingsDialog = false;">Save Settings</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style>
.el-select-dropdown__item {
  height: auto;
}

/* .validation-warnings .el-alert__content {
  flex-grow: 1;
} */
.validation-warnings .el-collapse {
  --el-collapse-header-bg-color: transparent;
  --el-collapse-content-bg-color: transparent;
  --el-collapse-header-font-size: 14px;
  --el-collapse-header-text-color: inherit;
  --el-collapse-content-text-color: inherit;
}

.el-dialog {
  width: unset;
  max-width: var(--el-dialog-width);
}

.el-dialog .el-dialog__body {
  max-height: calc(100svh - 200px);
  overflow: auto;
}
</style>
