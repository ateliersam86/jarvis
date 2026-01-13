#!/usr/bin/env node
/**
 * i18n-diff.mjs - Detects missing translation keys between source and target languages
 * 
 * Usage: 
 *   node scripts/i18n-diff.mjs                    # Compare all languages
 *   node scripts/i18n-diff.mjs --lang en          # Compare only English
 *   node scripts/i18n-diff.mjs --verbose          # Show all keys
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = path.join(__dirname, '../web/messages');

// Configuration
const SOURCE_LANG = 'fr';
const TARGET_LANGS = ['en', 'es', 'de', 'it', 'pt', 'ja', 'zh'];

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
 * Find missing keys in target compared to source
 */
function findMissingKeys(sourceFlat, targetFlat) {
    const missing = {};
    for (const [key, value] of Object.entries(sourceFlat)) {
        if (!(key in targetFlat)) {
            missing[key] = value;
        }
    }
    return missing;
}

/**
 * Find extra keys in target that don't exist in source
 */
function findExtraKeys(sourceFlat, targetFlat) {
    const extra = {};
    for (const [key, value] of Object.entries(targetFlat)) {
        if (!(key in sourceFlat)) {
            extra[key] = value;
        }
    }
    return extra;
}

/**
 * Load and parse a language file
 */
async function loadLangFile(lang) {
    const filePath = path.join(MESSAGES_DIR, `${lang}.json`);
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        console.error(`Error loading ${lang}.json:`, error.message);
        return null;
    }
}

/**
 * Compare source language with all targets
 */
async function compareLanguages(targetLangs, verbose = false) {
    const sourceData = await loadLangFile(SOURCE_LANG);
    if (!sourceData) {
        console.error(`❌ Source language ${SOURCE_LANG}.json not found!`);
        process.exit(1);
    }

    const sourceFlat = flattenObject(sourceData);
    const sourceKeyCount = Object.keys(sourceFlat).length;

    console.log(`\n📊 Source: ${SOURCE_LANG}.json (${sourceKeyCount} keys)\n`);
    console.log('─'.repeat(60));

    const results = {};

    for (const lang of targetLangs) {
        const targetData = await loadLangFile(lang);
        if (!targetData) {
            results[lang] = { error: 'File not found' };
            continue;
        }

        const targetFlat = flattenObject(targetData);
        const missing = findMissingKeys(sourceFlat, targetFlat);
        const extra = findExtraKeys(sourceFlat, targetFlat);

        const missingCount = Object.keys(missing).length;
        const extraCount = Object.keys(extra).length;
        const coverage = ((sourceKeyCount - missingCount) / sourceKeyCount * 100).toFixed(1);

        results[lang] = { missing, extra, coverage, missingCount, extraCount };

        // Display summary
        const statusIcon = missingCount === 0 ? '✅' : '⚠️';
        console.log(`${statusIcon} ${lang}.json: ${coverage}% coverage (${missingCount} missing, ${extraCount} extra)`);

        if (verbose && missingCount > 0) {
            console.log(`   Missing keys:`);
            Object.keys(missing).slice(0, 5).forEach(key => {
                console.log(`   - ${key}`);
            });
            if (missingCount > 5) {
                console.log(`   ... and ${missingCount - 5} more`);
            }
        }
    }

    console.log('─'.repeat(60));

    return results;
}

/**
 * Export results as JSON for other scripts
 */
async function exportResults(results) {
    const outputPath = path.join(__dirname, '../.cache/i18n-diff.json');
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
    console.log(`\n📁 Results saved to: .cache/i18n-diff.json`);
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    const verbose = args.includes('--verbose') || args.includes('-v');
    const langIndex = args.indexOf('--lang');

    let targetLangs = TARGET_LANGS;
    if (langIndex !== -1 && args[langIndex + 1]) {
        targetLangs = [args[langIndex + 1]];
    }

    console.log('🔍 Jarvis i18n Diff Tool\n');

    const results = await compareLanguages(targetLangs, verbose);

    // Check if any translations are needed
    const totalMissing = Object.values(results)
        .reduce((sum, r) => sum + (r.missingCount || 0), 0);

    if (totalMissing > 0) {
        console.log(`\n⚡ ${totalMissing} total keys need translation`);
        console.log(`   Run: node scripts/i18n-translate.mjs`);
        await exportResults(results);
    } else {
        console.log(`\n✨ All translations are complete!`);
    }
}

main().catch(console.error);
