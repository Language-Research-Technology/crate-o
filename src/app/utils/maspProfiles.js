import { ROCrate } from 'ro-crate';
import * as maspValidatorModule from 'ro-crate-maps/lib/masp-validator.js';

import ldacProfileCrate from 'ro-crate-maps/profiles/ldac/profile-crate/ro-crate-metadata.json';
import ldacEditorHints from 'ro-crate-maps/profiles/ldac/profile-crate/crate-o-mode.json';
import roCrateProfileCrate from 'ro-crate-maps/profiles/ro-crate/profile-crate/ro-crate-metadata.json';
import roCrateEditorHints from 'ro-crate-maps/profiles/ro-crate/profile-crate/crate-o-mode.json';
import roCrateMaspProfileCrate from 'ro-crate-maps/profiles/ro-crate-masp/profile-crate/ro-crate-metadata.json';
import roCrateMaspEditorHints from 'ro-crate-maps/profiles/ro-crate-masp/profile-crate/crate-o-mode.json';
import schemaOrgProfileCrate from 'ro-crate-maps/profiles/schema-org/profile-crate/ro-crate-metadata.json';
import schemaOrgEditorHints from 'ro-crate-maps/profiles/schema-org/profile-crate/crate-o-mode.json';
import softwareProfileCrate from 'ro-crate-maps/profiles/software/profile-crate/ro-crate-metadata.json';
import softwareEditorHints from 'ro-crate-maps/profiles/software/profile-crate/crate-o-mode.json';
import workflowProfileCrate from 'ro-crate-maps/profiles/workflow/profile-crate/ro-crate-metadata.json';
import workflowEditorHints from 'ro-crate-maps/profiles/workflow/profile-crate/crate-o-mode.json';

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

const schemaOrgProfile = buildProfile(schemaOrgProfileCrate, schemaOrgEditorHints);
const schemaOrgFallbackGroups = schemaOrgProfile.getPropertyGroups?.() || [];

export const maspProfiles = [
  buildProfile(roCrateProfileCrate, roCrateEditorHints, schemaOrgFallbackGroups),
  schemaOrgProfile,
  buildProfile(ldacProfileCrate, ldacEditorHints, schemaOrgFallbackGroups),
  buildProfile(workflowProfileCrate, workflowEditorHints, schemaOrgFallbackGroups),
  buildProfile(softwareProfileCrate, softwareEditorHints, schemaOrgFallbackGroups),
  buildProfile(roCrateMaspProfileCrate, roCrateMaspEditorHints, schemaOrgFallbackGroups)
];

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

export const maspProfilesPromise = Promise.resolve(maspProfiles);
