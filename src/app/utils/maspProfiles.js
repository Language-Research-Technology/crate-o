import { ROCrate } from 'ro-crate';
import * as maspValidatorModule from 'ro-crate-maps/lib/masp-validator.js';
import profileMetadataUrlsConfig from '../../../crate-o-masp-config.json';

const { MaspValidator } = maspValidatorModule;

const profileDebugEnabled = (() => {
  if (typeof window === 'undefined') return false;
  return window.localStorage?.getItem('crateOProfileDebug') !== '0';
})();

function profileDebug(...args) {
  if (!profileDebugEnabled) return;
  console.log('[crate-o:profile]', ...args);
}

function hasLayoutGroups(editorHints) {
  const propertyGroups = editorHints?.propertyGroups;
  return Array.isArray(propertyGroups) && propertyGroups.length > 0;
}

function withDefaultLayout(editorHints, fallbackPropertyGroups = []) {
  const baseHints = editorHints || {};
  if (hasLayoutGroups(baseHints)) {
    return baseHints;
  }
  if (!Array.isArray(fallbackPropertyGroups) || fallbackPropertyGroups.length === 0) {
    return baseHints;
  }
  return {
    ...baseHints,
    propertyGroups: fallbackPropertyGroups
  };
}

function buildProfile(profileCrateJson, editorHints, fallbackPropertyGroups = []) {
  const crate = new ROCrate(profileCrateJson, { array: true, link: true });
  const effectiveHints = withDefaultLayout(editorHints, fallbackPropertyGroups);
  const validator = new MaspValidator(crate).setEditorHints(effectiveHints);
  validator.ensureParsed();
  const metadata = validator.getProfileMetadata?.() || {};
  const groupNames = (validator.getPropertyGroups?.() || []).map((g) => g?.name).filter(Boolean);
  profileDebug('buildProfile', {
    name: metadata.name,
    usedSchemaOrgFallbackGroups: !hasLayoutGroups(editorHints) && groupNames.length > 0,
    groupCount: groupNames.length,
    groups: groupNames,
    conformsTo: validator.getConformsToUris?.() || []
  });
  return validator;
}

function deriveProfileNameFromUrl(metadataUrl) {
  const match = metadataUrl.match(/\/profiles\/([^/]+)\/profile-crate\/ro-crate-metadata\.json$/);
  const key = match?.[1] || 'profile';
  const labels = {
    'ro-crate': 'RO-Crate Profile',
    'schema-org': 'RO-Crate + Schema.org Profile',
    ldac: 'Language Data Commons (LDAC)',
    workflow: 'Workflow',
    software: 'Software',
    'ro-crate-masp': 'RO-Crate MASP Profile',
  };
  return labels[key] || key;
}

function getEditorHintsUrl(metadataUrl) {
  try {
    const url = new URL(metadataUrl);
    url.search = '';
    url.hash = '';
    url.pathname = url.pathname.replace(/\/ro-crate-metadata\.json$/, '/crate-o-mode.json');
    return url.toString();
  } catch (_error) {
    return metadataUrl.replace(/ro-crate-metadata\.json(?:\?.*)?$/, 'crate-o-mode.json');
  }
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url} (HTTP ${response.status})`);
  }
  return response.json();
}

function getConfiguredProfileMetadataUrls() {
  if (Array.isArray(profileMetadataUrlsConfig)) {
    return profileMetadataUrlsConfig.filter((url) => typeof url === 'string' && url);
  }
  return [];
}

async function loadProfileDefinition(metadataUrl) {
  const profileCrateJson = await fetchJson(metadataUrl);

  const editorHintsUrl = getEditorHintsUrl(metadataUrl);
  let editorHints = {};
  try {
    editorHints = await fetchJson(editorHintsUrl);
  } catch (error) {
    profileDebug('loadEditorHintsFailed', { metadataUrl, editorHintsUrl, message: error?.message });
  }

  return { metadataUrl, profileCrateJson, editorHints };
}

async function loadProfilesFromConfig() {
  const metadataUrls = getConfiguredProfileMetadataUrls();

  const schemaOrgMetadataUrl =
    metadataUrls.find((url) => url.includes('/schema-org/')) ||
    'https://language-research-technology.github.io/ro-crate-masp/profiles/schema-org/profile-crate/ro-crate-metadata.json';

  let schemaOrgProfile = null;
  try {
    const schemaOrgDefinition = await loadProfileDefinition(schemaOrgMetadataUrl);
    schemaOrgProfile = buildProfile(schemaOrgDefinition.profileCrateJson, schemaOrgDefinition.editorHints);
  } catch (error) {
    profileDebug('loadSchemaOrgFailed', { metadataUrl: schemaOrgMetadataUrl, message: error?.message });
  }

  const schemaOrgFallbackGroups = schemaOrgProfile?.getPropertyGroups?.() || [];

  const lazyProfiles = metadataUrls.map((metadataUrl) => {
    if (schemaOrgProfile && metadataUrl === schemaOrgMetadataUrl) {
      return schemaOrgProfile;
    }

    let loadedProfile = null;
    let loadingPromise = null;
    const metadata = {
      name: deriveProfileNameFromUrl(metadataUrl),
      description: metadataUrl,
    };

    const ensureLoaded = async () => {
      if (loadedProfile) {
        return loadedProfile;
      }
      if (!loadingPromise) {
        loadingPromise = loadProfileDefinition(metadataUrl)
          .then((definition) => {
            loadedProfile = buildProfile(
              definition.profileCrateJson,
              definition.editorHints,
              schemaOrgFallbackGroups
            );
            const loadedMetadata = loadedProfile.getProfileMetadata?.() || {};
            metadata.description = loadedMetadata.description || metadata.description;
            return loadedProfile;
          })
          .catch((error) => {
            loadingPromise = null;
            throw error;
          });
      }
      return loadingPromise;
    };

    return {
      metadata,
      ensureLoaded,
      getProfileMetadata() {
        if (!loadedProfile?.getProfileMetadata) {
          return metadata;
        }
        const loadedMetadata = loadedProfile.getProfileMetadata() || {};
        return {
          ...loadedMetadata,
          // Keep a stable profile name so selection continues to resolve after lazy loading.
          name: metadata.name,
          description: loadedMetadata.description || metadata.description,
        };
      },
      getPropertyGroups() {
        return loadedProfile?.getPropertyGroups?.() || [];
      },
      getConformsToUris() {
        return loadedProfile?.getConformsToUris?.() || [];
      },
      async validateCrate(crate) {
        const profile = await ensureLoaded();
        return profile.validateCrate(crate);
      },
    };
  });

  if (schemaOrgProfile && !lazyProfiles.includes(schemaOrgProfile)) {
    lazyProfiles.unshift(schemaOrgProfile);
  }

  return lazyProfiles;
}

export const maspProfiles = [];

export const maspProfilesPromise = loadProfilesFromConfig().then((profiles) => {
  maspProfiles.splice(0, maspProfiles.length, ...profiles);

  profileDebug('profilesLoaded', maspProfiles.map((p, index) => {
    const metadata = p.getProfileMetadata?.() || {};
    const groups = (p.getPropertyGroups?.() || []).map((g) => g?.name).filter(Boolean);
    return {
      index,
      name: metadata.name,
      groupCount: groups.length,
      groups
    };
  }));

  return maspProfiles;
});
