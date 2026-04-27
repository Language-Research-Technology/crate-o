/**
 * MASP Profile Index Manager
 * 
 * Manages loading, caching, and access to MASP profiles
 * Acts as a central registry for profile data
 */

import { loadMaspProfiles } from './maspProfileLoader.js';

class ProfileIndex {
  constructor(config = {}) {
    this.config = config;
    this.profiles = {};
    this.isLoading = false;
    this.loadErrors = {};
    this.observers = [];
  }

  /**
   * Initialize the profile index from a config object
   * @param {Object} config - Configuration with profiles
   * @returns {Promise<void>}
   */
  async initialize(config) {
    if (this.isLoading) {
      console.warn('Profile loading already in progress');
      return;
    }

    this.config = config;
    this.isLoading = true;
    this.notifyObservers({ type: 'loading', profiles: {} });

    try {
      const { profiles, errors } = await loadMaspProfiles(config);
      this.profiles = profiles;
      this.loadErrors = errors;
      this.notifyObservers({ type: 'loaded', profiles, errors });
    } catch (error) {
      console.error('Error initializing profile index:', error);
      this.notifyObservers({ type: 'error', error });
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Get a profile by name
   * @param {string} name - Profile name
   * @returns {Object|null} Profile configuration or null if not found
   */
  getProfile(name) {
    return this.profiles[name] || null;
  }

  /**
   * Get all available profiles
   * @returns {Object} Map of profile names to configurations
   */
  getAllProfiles() {
    return { ...this.profiles };
  }

  /**
   * Get list of available profile names
   * @returns {Array<string>} Profile names
   */
  getProfileNames() {
    return Object.keys(this.profiles);
  }

  /**
   * Check if a profile is loaded
   * @param {string} name - Profile name
   * @returns {boolean}
   */
  hasProfile(name) {
    return name in this.profiles;
  }

  /**
   * Check if profile loading encountered any errors
   * @returns {boolean}
   */
  hasErrors() {
    return Object.keys(this.loadErrors).length > 0;
  }

  /**
   * Get loading errors
   * @returns {Object} Map of profile names to error messages
   */
  getErrors() {
    return { ...this.loadErrors };
  }

  /**
   * Subscribe to profile index changes
   * @param {Function} callback - Callback function
   */
  subscribe(callback) {
    this.observers.push(callback);
    return () => {
      this.observers = this.observers.filter(o => o !== callback);
    };
  }

  /**
   * Notify all observers of changes
   * @private
   */
  notifyObservers(event) {
    this.observers.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in profile index observer:', error);
      }
    });
  }

  /**
   * Reload profiles from config
   * @returns {Promise<void>}
   */
  async reload() {
    this.profiles = {};
    this.loadErrors = {};
    return this.initialize(this.config);
  }
}

// Global singleton instance
let profileIndexInstance = null;

/**
 * Get or create the global profile index instance
 * @returns {ProfileIndex}
 */
export function getProfileIndex() {
  if (!profileIndexInstance) {
    profileIndexInstance = new ProfileIndex();
  }
  return profileIndexInstance;
}

/**
 * Initialize the global profile index from config URL or object
 * @param {string|Object} configSource - Config URL or object
 * @returns {Promise<ProfileIndex>}
 */
export async function initializeProfileIndex(configSource) {
  const index = getProfileIndex();
  
  let config = configSource;
  
  // If configSource is a string, treat it as a URL and fetch it
  if (typeof configSource === 'string') {
    try {
      const response = await fetch(configSource);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      config = await response.json();
    } catch (error) {
      console.error('Error loading config from URL:', error);
      throw error;
    }
  }

  await index.initialize(config);
  return index;
}

export { ProfileIndex };
