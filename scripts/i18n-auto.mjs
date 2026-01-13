#!/usr/bin/env node

/**
 * JARVIS AUTO-I18N
 * 
 * Watches web/messages/en.json and automatically translates missing keys
 * for all other locales defined in web/messages/*.json using Gemini.
 */

import fs from 'fs';
import path from 'path';
import { delegate } from './masterscript.mjs';
import { flattenKeys, unflattenKeys, findMissingKeys, mergeTranslations, sortKeysByReference } from './lib/i18n-utils.mjs';

const MESSAGES_DIR = path.join(process.cwd(), 'web', 'messages');
const SOURCE_FILE = 'en.json';
const SOURCE_PATH = path.join(MESSAGES_DIR, SOURCE_FILE);

console.log('🌍 JARVIS AUTO-I18N SERVICE');
console.log(`👁️  Watching ${SOURCE_PATH}...
`);

let isProcessing = false;
let debounceTimer = null;

// Initial check
if (process.argv.includes('--once')) {
    checkAndTranslate().then(() => {
        console.log('✅ Single pass complete.');
        process.exit(0);
    });
} else {
    checkAndTranslate();
    
    // Watch for changes
    fs.watch(SOURCE_PATH, (eventType, filename) => {
        if (filename && eventType === 'change') {
            // Debounce to avoid multiple triggers
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                console.log('📝 Source file changed. Checking for missing translations...');
                checkAndTranslate();
            }, 2000);
        }
    });
}

async function checkAndTranslate() {
    if (isProcessing) return;
    isProcessing = true;

    try {
        const sourceContent = fs.readFileSync(SOURCE_PATH, 'utf-8');
        const sourceObj = JSON.parse(sourceContent);
        const sourceFlat = flattenKeys(sourceObj);

        // Get all target files
        const files = fs.readdirSync(MESSAGES_DIR);
        const targetFiles = files.filter(f => f.endsWith('.json') && f !== SOURCE_FILE);

        for (const file of targetFiles) {
            await processTarget(file, sourceFlat, sourceObj);
        }

    } catch (error) {
        console.error('❌ Error in auto-i18n loop:', error.message);
    } finally {
        isProcessing = false;
    }
}

async function processTarget(filename, sourceFlat, sourceObj) {
    const locale = filename.replace('.json', '');
    const targetPath = path.join(MESSAGES_DIR, filename);
    
    let targetObj = {};
    try {
        if (fs.existsSync(targetPath)) {
            targetObj = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
        }
    } catch (e) {
        console.warn(`⚠️ Could not read ${filename}, starting empty.`);
    }

    const targetFlat = flattenKeys(targetObj);
    const missingKeys = findMissingKeys(sourceFlat, targetFlat);
    const missingCount = Object.keys(missingKeys).length;

    if (missingCount === 0) {
        return; // Nothing to do
    }

    console.log(`Found ${missingCount} missing keys for [${locale}]`);

    // Translate in batches of 20
    const keys = Object.keys(missingKeys);
    const BATCH_SIZE = 20;
    
    const newTranslations = {};

    for (let i = 0; i < keys.length; i += BATCH_SIZE) {
        const batchKeys = keys.slice(i, i + BATCH_SIZE);
        const batchObj = {};
        batchKeys.forEach(k => batchObj[k] = missingKeys[k]);

        console.log(`  🔄 Translating batch ${i/BATCH_SIZE + 1}/${Math.ceil(keys.length/BATCH_SIZE)} for ${locale}...`);

        try {
            const translatedBatch = await translateBatch(batchObj, locale);
            Object.assign(newTranslations, translatedBatch);
        } catch (err) {
            console.error(`  ❌ Failed to translate batch for ${locale}:`, err.message);
        }
    }

    // Merge and Save
    if (Object.keys(newTranslations).length > 0) {
        const mergedObj = mergeTranslations(targetObj, newTranslations);
        
        // Sort keys to match source (en.json) order for clean diffs
        const sortedObj = sortKeysByReference(mergedObj, sourceObj);

        fs.writeFileSync(targetPath, JSON.stringify(sortedObj, null, 2) + '\n');
        console.log(`  ✅ Updated ${filename} with ${Object.keys(newTranslations).length} new translations.`);
    }
}

async function translateBatch(batchObj, targetLocale) {
    const prompt = `Translate the following JSON content from English to ${targetLocale}.
    
RULES:
1. Output ONLY valid JSON. No markdown, no comments.
2. Preserve all keys EXACTLY as they are (dot notation).
3. Translate the values to ${targetLocale}.
4. Do not translate variables inside {{...}} or { ... }.

CONTENT TO TRANSLATE:
${JSON.stringify(batchObj, null, 2)}`;

    const result = await delegate(prompt, {
        model: 'gemini:flash', // Use Flash for speed and cost
        noParse: true,
        silent: true
    });

    if (!result.success) {
        throw new Error(result.error);
    }

    // Extract JSON
    const jsonMatch = result.output.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('No JSON found in response');
    }

    return JSON.parse(jsonMatch[0]);
}
