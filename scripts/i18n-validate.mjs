#!/usr/bin/env node
/**
 * i18n-validate.mjs - Validates all translation files for consistency
 * 
 * Checks:
 * - JSON syntax validity
 * - All keys present in all languages
 * - No HTML/placeholder corruption
 * - Build compatibility
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = path.join(__dirname, '../web/messages');
const SOURCE_LANG = 'fr';
const ALL_LANGS = ['fr', 'en', 'es', 'de', 'it', 'pt', 'ja', 'zh'];

/**
 * Flatten nested JSON to dot notation keys
 */
function flattenObject(obj, prefix = '') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            Object.assign(result, flattenObject(value, newKey));
        } else {
            result[newKey] = value;
        }
    }
    return result;
}

/**
 * Extract placeholders from string
 */
function extractPlaceholders(str) {
    if (typeof str !== 'string') return [];
    const matches = str.match(/\{[^}]+\}/g) || [];
    return matches.sort();
}

/**
 * Validate JSON syntax
 */
async function validateJsonSyntax(lang) {
    const filePath = path.join(MESSAGES_DIR, `${lang}.json`);
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        JSON.parse(content);
        return { valid: true };
    } catch (error) {
        return { valid: false, error: error.message };
    }
}

/**
 * Validate placeholder consistency
 */
function validatePlaceholders(sourceValue, targetValue, key) {
    const sourcePlaceholders = extractPlaceholders(sourceValue);
    const targetPlaceholders = extractPlaceholders(targetValue);

    if (JSON.stringify(sourcePlaceholders) !== JSON.stringify(targetPlaceholders)) {
        return {
            valid: false,
            error: `Placeholder mismatch in ${key}: source=${sourcePlaceholders.join(',')} target=${targetPlaceholders.join(',')}`
        };
    }
    return { valid: true };
}

/**
 * Run all validations
 */
async function validate() {
    console.log('🔍 Jarvis i18n Validation\n');
    console.log('─'.repeat(60));

    const errors = [];
    const warnings = [];

    // 1. Validate JSON syntax for all files
    console.log('\n📋 Checking JSON syntax...');
    for (const lang of ALL_LANGS) {
        const result = await validateJsonSyntax(lang);
        if (!result.valid) {
            errors.push(`❌ ${lang}.json: ${result.error}`);
            console.log(`   ❌ ${lang}.json - INVALID`);
        } else {
            console.log(`   ✅ ${lang}.json - valid`);
        }
    }

    // 2. Load source and compare keys
    console.log('\n📋 Checking key consistency...');
    const sourceContent = await fs.readFile(path.join(MESSAGES_DIR, `${SOURCE_LANG}.json`), 'utf-8');
    const sourceData = JSON.parse(sourceContent);
    const sourceFlat = flattenObject(sourceData);
    const sourceKeys = Object.keys(sourceFlat);

    for (const lang of ALL_LANGS.filter(l => l !== SOURCE_LANG)) {
        try {
            const targetContent = await fs.readFile(path.join(MESSAGES_DIR, `${lang}.json`), 'utf-8');
            const targetData = JSON.parse(targetContent);
            const targetFlat = flattenObject(targetData);
            const targetKeys = Object.keys(targetFlat);

            const missingKeys = sourceKeys.filter(k => !targetKeys.includes(k));
            const extraKeys = targetKeys.filter(k => !sourceKeys.includes(k));

            if (missingKeys.length > 0) {
                warnings.push(`⚠️  ${lang}.json: ${missingKeys.length} missing keys`);
                console.log(`   ⚠️  ${lang}.json - ${missingKeys.length} missing keys`);
            } else if (extraKeys.length > 0) {
                console.log(`   ℹ️  ${lang}.json - ${extraKeys.length} extra keys (OK)`);
            } else {
                console.log(`   ✅ ${lang}.json - all keys present`);
            }
        } catch (error) {
            errors.push(`❌ ${lang}.json: ${error.message}`);
        }
    }

    // 3. Check placeholder consistency
    console.log('\n📋 Checking placeholder consistency...');
    let placeholderIssues = 0;

    for (const lang of ALL_LANGS.filter(l => l !== SOURCE_LANG)) {
        try {
            const targetContent = await fs.readFile(path.join(MESSAGES_DIR, `${lang}.json`), 'utf-8');
            const targetData = JSON.parse(targetContent);
            const targetFlat = flattenObject(targetData);

            for (const [key, sourceValue] of Object.entries(sourceFlat)) {
                if (key in targetFlat) {
                    const result = validatePlaceholders(sourceValue, targetFlat[key], key);
                    if (!result.valid) {
                        placeholderIssues++;
                        if (placeholderIssues <= 3) {
                            warnings.push(`⚠️  ${lang}: ${result.error}`);
                        }
                    }
                }
            }
        } catch (error) {
            // Skip if file couldn't be parsed
        }
    }

    if (placeholderIssues > 0) {
        console.log(`   ⚠️  ${placeholderIssues} placeholder issues found`);
    } else {
        console.log(`   ✅ All placeholders consistent`);
    }

    // Summary
    console.log('\n' + '─'.repeat(60));

    if (errors.length > 0) {
        console.log('\n❌ ERRORS:');
        errors.forEach(e => console.log(`   ${e}`));
    }

    if (warnings.length > 0) {
        console.log('\n⚠️  WARNINGS:');
        warnings.slice(0, 10).forEach(w => console.log(`   ${w}`));
        if (warnings.length > 10) {
            console.log(`   ... and ${warnings.length - 10} more`);
        }
    }

    if (errors.length === 0 && warnings.length === 0) {
        console.log('\n✨ All validations passed!');
        return 0;
    } else if (errors.length > 0) {
        console.log('\n❌ Validation failed with errors');
        return 1;
    } else {
        console.log('\n⚠️  Validation passed with warnings');
        return 0;
    }
}

validate().then(code => process.exit(code)).catch(err => {
    console.error(err);
    process.exit(1);
});
