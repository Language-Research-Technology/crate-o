/**
 * MASP Profile Loader
 * 
 * Loads RO-Crate MASP Profile Crates and extracts configuration
 * including property groups, lookups, and data model information.
 */

import { ROCrate } from 'ro-crate';

/**
 * Load a MASP profile crate from a directory path or URL
 * @param {string} profilePath - Path to profile-crate directory (relative or absolute)
 * @returns {Promise<Object>} Normalized profile configuration
 */
export async function loadMaspProfile(profilePath) {
  try {
    // Fetch the ro-crate-metadata.json
    const metadataUrl = new URL('ro-crate-metadata.json', profilePath).href;
    const metadataResponse = await fetch(metadataUrl);
    if (!metadataResponse.ok) {
      throw new Error(`Failed to load profile metadata from ${metadataUrl}`);
    }
    const profileMetadata = await metadataResponse.json();

    // Load the profile with ROCrate library
    const crate = new ROCrate(profileMetadata, { resolveLabels: true });

    // Extract root data entity info (this tells us what root types are allowed)
    const rootDatasetEntity = crate.getEntity('./');
    const rootTypes = Array.isArray(rootDatasetEntity?.['@type'])
      ? rootDatasetEntity['@type']
      : [rootDatasetEntity?.['@type']];

    // Try to load crate-o-mode.json for UI configuration
    let modeConfig = {};
    try {
      const modeUrl = new URL('crate-o-mode.json', profilePath).href;
      const modeResponse = await fetch(modeUrl);
      if (modeResponse.ok) {
        modeConfig = await modeResponse.json();
      }
    } catch (e) {
      console.warn(`Could not load crate-o-mode.json from ${profilePath}:`, e.message);
    }

    // Build normalized profile configuration
    const profile = {
      name: modeConfig.metadata?.name || profileMetadata['@graph']?.[0]?.name || 'Unknown Profile',
      description: modeConfig.metadata?.description || profileMetadata['@graph']?.[0]?.description || '',
      version: modeConfig.metadata?.version || '0.1',
      author: modeConfig.metadata?.author || '',
      license: modeConfig.metadata?.license || '',
      
      // Root data entity configuration
      rootDataset: {
        types: rootTypes,
        conformsTo: modeConfig.conformsToUri || [],
      },

      // UI configuration from crate-o-mode
      inputGroups: modeConfig.inputGroups || [],
      contextPrefixes: modeConfig.contextPrefixes || {},
      
      // Lookups for autocomplete fields
      lookups: modeConfig.lookups || {},

      // Raw profile metadata for advanced use
      metadata: profileMetadata,
      modeConfig: modeConfig,
      crate: crate, // ROCrate instance for programmatic access
    };

    return profile;
  } catch (error) {
    console.error('Error loading MASP profile:', error);
    throw error;
  }
}

/**
 * Load multiple MASP profiles from configuration
 * @param {Object} config - Configuration object with profiles
 * @param {Object} config.profiles - Map of profile name to profile path
 * @returns {Promise<Object>} Map of profile names to loaded profile configs
 */
export async function loadMaspProfiles(config) {
  const profiles = {};
  const errors = {};

  for (const [name, profileConfig] of Object.entries(config.profiles || {})) {
    try {
      const path = profileConfig.path || profileConfig;
      profiles[name] = await loadMaspProfile(path);
    } catch (error) {
      errors[name] = error.message;
      console.error(`Failed to load profile "${name}":`, error);
    }
  }

  return { profiles, errors };
}

/**
 * Get input groups from a loaded profile
 * @param {Object} profile - Loaded MASP profile
 * @returns {Array} Array of input group objects
 */
export function getInputGroups(profile) {
  return profile.inputGroups || [];
}

/**
 * Get lookups (for autocomplete, dropdowns, etc.)
 * @param {Object} profile - Loaded MASP profile
 * @returns {Object} Map of lookup field names to lookup configurations
 */
export function getLookups(profile) {
  return profile.lookups || {};
}

/**
 * Get allowed root entity types for a profile
 * @param {Object} profile - Loaded MASP profile
 * @returns {Array} Array of allowed @type values for root entity
 */
export function getRootDatasetTypes(profile) {
  return profile.rootDataset?.types || [];
}

/**
 * Get context prefixes defined in the profile
 * @param {Object} profile - Loaded MASP profile
 * @returns {Object} Map of prefix names to namespace URIs
 */
export function getContextPrefixes(profile) {
  return profile.contextPrefixes || {};
}
