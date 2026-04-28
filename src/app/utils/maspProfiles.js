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

function buildProfile(profileCrateJson, editorHints) {
  const crate = new ROCrate(profileCrateJson, { array: true, link: true });
  const validator = new MaspValidator(crate).setEditorHints(editorHints);
  validator.ensureParsed();
  return validator;
}

export const maspProfiles = [
  buildProfile(roCrateProfileCrate, roCrateEditorHints),
  buildProfile(schemaOrgProfileCrate, schemaOrgEditorHints),
  buildProfile(ldacProfileCrate, ldacEditorHints),
  buildProfile(workflowProfileCrate, workflowEditorHints),
  buildProfile(softwareProfileCrate, softwareEditorHints),
  buildProfile(roCrateMaspProfileCrate, roCrateMaspEditorHints)
];

export const maspProfilesPromise = Promise.resolve(maspProfiles);
