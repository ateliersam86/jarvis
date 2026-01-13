
/**
 * Flattens a nested JSON object into a single-level object with dot-notation keys.
 * @param {Object} obj - The object to flatten.
 * @param {string} prefix - The current key prefix (used for recursion).
 * @returns {Object} - The flattened object.
 */
export function flattenKeys(obj, prefix = '') {
    const flattened = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            const newKey = prefix ? `${prefix}.${key}` : key;
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                Object.assign(flattened, flattenKeys(value, newKey));
            } else {
                flattened[newKey] = value;
            }
        }
    }
    return flattened;
}

/**
 * Unflattens a single-level object with dot-notation keys back into a nested object.
 * @param {Object} flatObj - The flattened object.
 * @returns {Object} - The nested object.
 */
export function unflattenKeys(flatObj) {
    const result = {};
    for (const key in flatObj) {
        if (Object.prototype.hasOwnProperty.call(flatObj, key)) {
            const value = flatObj[key];
            const keys = key.split('.');
            let current = result;
            for (let i = 0; i < keys.length; i++) {
                const k = keys[i];
                if (i === keys.length - 1) {
                    current[k] = value;
                } else {
                    current[k] = current[k] || {};
                    current = current[k];
                }
            }
        }
    }
    return result;
}

/**
 * Identifies keys present in source but missing in target.
 * @param {Object} sourceFlat - Flattened source object.
 * @param {Object} targetFlat - Flattened target object.
 * @returns {Object} - Object containing only the missing keys and their source values.
 */
export function findMissingKeys(sourceFlat, targetFlat) {
    const missing = {};
    for (const key in sourceFlat) {
        if (!Object.prototype.hasOwnProperty.call(targetFlat, key)) {
            missing[key] = sourceFlat[key];
        }
    }
    return missing;
}

/**
 * Merges new translations into the existing target object, preserving order if possible.
 * Note: Simple merge. Key sorting to match source requires more complex logic (not implemented here for simplicity).
 * @param {Object} targetObj - The original target nested object.
 * @param {Object} newTranslationsFlat - The new translations (flattened).
 * @returns {Object} - The merged nested object.
 */
export function mergeTranslations(targetObj, newTranslationsFlat) {
    const newNested = unflattenKeys(newTranslationsFlat);
    
    // Deep merge helper
    function deepMerge(target, source) {
        for (const key in source) {
            if (source[key] instanceof Object && key in target) {
                Object.assign(source[key], deepMerge(target[key], source[key]));
            }
        }
        Object.assign(target || {}, source);
        return target;
    }

    // We actually want to merge newNested INTO targetObj
    // But standard Object.assign or spread might overwrite entire sub-objects if not careful.
    // A better way for i18n files is to use the unflattened structure and just set the values.
    
    // Re-flatten target to mix easily? No, we want to preserve structure.
    // Let's iterate the flat new translations and set them in the target object.
    
    const result = JSON.parse(JSON.stringify(targetObj)); // Deep copy
    
    for (const key in newTranslationsFlat) {
        const value = newTranslationsFlat[key];
        const keys = key.split('.');
        let current = result;
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            if (i === keys.length - 1) {
                current[k] = value;
            } else {
                current[k] = current[k] || {};
                current = current[k];
            }
        }
    }
    
    return result;
}

/**
 * Sorts keys of an object based on the reference object's key order.
 * @param {Object} obj - The object to sort.
 * @param {Object} ref - The reference object defining the order.
 * @returns {Object} - A new object with sorted keys.
 */
export function sortKeysByReference(obj, ref) {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
        return obj;
    }
    
    const sorted = {};
    
    // First, add keys that exist in ref, in ref's order
    for (const key in ref) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            sorted[key] = sortKeysByReference(obj[key], ref[key]);
        }
    }
    
    // Then add any keys in obj that weren't in ref (at the end)
    for (const key in obj) {
        if (!Object.prototype.hasOwnProperty.call(ref, key)) {
            sorted[key] = obj[key];
        }
    }
    
    return sorted;
}
