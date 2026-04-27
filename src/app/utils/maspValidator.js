/**
 * MASP Profile Validator
 * 
 * Validates RO-Crates against MASP profiles and provides
 * constraint information for UI logic
 */

/**
 * Wrapper around MASP profile crate to provide validation and constraint information
 */
export class MaspProfileValidator {
  constructor(profile) {
    this.profile = profile;
    this.crate = profile.crate; // ROCrate instance
    this.metadata = profile.metadata; // Raw RO-Crate metadata
  }

  /**
   * Get all entity type rules from the profile
   * @returns {Array} Array of class rule entities
   */
  getClassRules() {
    const classes = [];
    for (const entity of this.crate.entities()) {
      if (entity['@type']?.includes('rdfs:Class')) {
        classes.push(entity);
      }
    }
    return classes;
  }

  /**
   * Get property rules for a specific entity type
   * @param {string|Array} entityType - Entity type(s) to query
   * @returns {Array} Array of property rule entities
   */
  getPropertyRulesForType(entityType) {
    const types = Array.isArray(entityType) ? entityType : [entityType];
    const properties = [];

    // Find all property rules and filter by domain
    for (const entity of this.crate.entities()) {
      if (entity['@type']?.includes('rdf:Property')) {
        const domains = Array.isArray(entity.domainIncludes)
          ? entity.domainIncludes
          : entity.domainIncludes ? [entity.domainIncludes] : [];
        
        // Check if this property applies to our type
        const domainIds = domains.map(d => d['@id'] || d);
        for (const type of types) {
          if (domainIds.some(id => id === type || id.endsWith(type))) {
            properties.push(entity);
            break;
          }
        }
      }
    }

    return properties;
  }

  /**
   * Get constraints (min/max count) for a property on a type
   * @param {string} propertyId - Property ID
   * @param {string} entityType - Entity type
   * @returns {Object} Constraints {minCount, maxCount, required}
   */
  getPropertyConstraints(propertyId, entityType) {
    const property = this.crate.getEntity(propertyId);
    if (!property) {
      return { minCount: 0, maxCount: Infinity, required: false };
    }

    const minCount = property['sh:minCount'] ? parseInt(property['sh:minCount']) : 0;
    const maxCount = property['sh:maxCount'] ? parseInt(property['sh:maxCount']) : Infinity;

    return {
      minCount,
      maxCount,
      required: minCount > 0,
    };
  }

  /**
   * Get range (allowed value types) for a property
   * @param {string} propertyId - Property ID
   * @returns {Array} Array of allowed type entities
   */
  getPropertyRange(propertyId) {
    const property = this.crate.getEntity(propertyId);
    if (!property) return [];

    const ranges = Array.isArray(property.rangeIncludes)
      ? property.rangeIncludes
      : property.rangeIncludes ? [property.rangeIncludes] : [];

    return ranges.map(r => {
      const rangeId = r['@id'] || r;
      return this.crate.getEntity(rangeId) || { '@id': rangeId, name: rangeId };
    });
  }

  /**
   * Check if a property expects object references or literal values
   * @param {string} propertyId - Property ID
   * @returns {Object} {isObject: boolean, types: Array}
   */
  getPropertyValueType(propertyId) {
    const range = this.getPropertyRange(propertyId);
    
    if (range.length === 0) {
      return { isObject: false, types: ['Text'] };
    }

    const types = range.map(r => r.name || r['@id']);
    
    // Heuristic: if any range type looks like a class (custom or known), it's an object
    const isObject = range.some(r => {
      const type = r['@type'];
      return Array.isArray(type) ? type.includes('rdfs:Class') : type === 'rdfs:Class';
    });

    return { isObject, types };
  }

  /**
   * Get available entity types that can be placed in a crate
   * @returns {Array} Array of allowed root entity types
   */
  getRootEntityTypes() {
    return this.profile.rootDataset?.types || [];
  }

  /**
   * Get metadata about the profile
   * @returns {Object} Profile metadata
   */
  getProfileMetadata() {
    return {
      name: this.profile.name,
      description: this.profile.description,
      version: this.profile.version,
      author: this.profile.author,
      license: this.profile.license,
    };
  }

  /**
   * Get input groups (UI organization hint)
   * @returns {Array} Array of input group definitions
   */
  getInputGroups() {
    return this.profile.inputGroups || [];
  }

  /**
   * Get lookups (for autocomplete/dropdowns)
   * @returns {Object} Map of field names to lookup configurations
   */
  getLookups() {
    return this.profile.lookups || {};
  }

  /**
   * Validate a primitive value against property constraints
   * @param {*} value - Value to validate
   * @param {string} propertyId - Property ID
   * @param {string} entityType - Entity type context
   * @returns {Object} {valid: boolean, errors: Array}
   */
  validatePropertyValue(value, propertyId, entityType) {
    const errors = [];
    const property = this.crate.getEntity(propertyId);

    if (!property) {
      errors.push(`Property ${propertyId} not found in profile`);
      return { valid: false, errors };
    }

    // Check for required fixed values
    if (property['schema:value'] || property.value) {
      const expectedValue = property['schema:value'] || property.value;
      if (String(value) !== String(expectedValue)) {
        errors.push(`Property must have value "${expectedValue}"`);
      }
    }

    // Check value type matches range
    const { types } = this.getPropertyValueType(propertyId);
    if (types.length > 0 && types[0] !== 'Text') {
      // Would need type checking here
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export { MaspProfileValidator as default };
