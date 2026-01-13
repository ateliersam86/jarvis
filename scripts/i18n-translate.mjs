#!/usr/bin/env node
/**
 * i18n-translate.mjs - Translates missing keys using AI agents
 * 
 * Usage:
 *   node scripts/i18n-translate.mjs              # Translate all missing keys
 *   node scripts/i18n-translate.mjs --lang en    # Translate only English
 *   node scripts/i18n-translate.mjs --dry-run    # Preview without writing
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = path.join(__dirname, '../web/messages');
const CACHE_DIR = path.join(__dirname, '../.cache');

// Configuration
const SOURCE_LANG = 'fr';
const LANG_NAMES = {
    en: 'English',
    es: 'Spanish',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    ja: 'Japanese',
    zh: 'Chinese (Simplified)'
};

/**
 * Load diff results from cache
 */
async function loadDiffResults() {
    const diffPath = path.join(CACHE_DIR, 'i18n-diff.json');
    try {
        const content = await fs.readFile(diffPath, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        console.log('⚠️  No diff cache found. Running i18n-diff first...\n');
        // Run diff first
        await runCommand('node', ['scripts/i18n-diff.mjs']);
        const content = await fs.readFile(diffPath, 'utf-8');
        return JSON.parse(content);
    }
}

/**
 * Run a command and return output
 */
function runCommand(cmd, args) {
    return new Promise((resolve, reject) => {
        const proc = spawn(cmd, args, { cwd: path.join(__dirname, '..') });
        let output = '';
        proc.stdout.on('data', (data) => { output += data.toString(); });
        proc.stderr.on('data', (data) => { output += data.toString(); });
        proc.on('close', (code) => {
            if (code === 0) resolve(output);
            else reject(new Error(`Command failed with code ${code}`));
        });
    });
}

/**
 * Translate keys using Gemini CLI
 */
async function translateWithAgent(lang, missingKeys) {
    const langName = LANG_NAMES[lang] || lang;
    const keysJson = JSON.stringify(missingKeys, null, 2);

    const prompt = `Translate the following JSON key-value pairs from French to ${langName}.
Keep the exact same JSON structure. Only translate the string values, not the keys.
Preserve any HTML tags, placeholders like {name}, and formatting.

French source:
${keysJson}

Return ONLY the translated JSON object, no explanation.`;

    console.log(`   🔄 Translating ${Object.keys(missingKeys).length} keys to ${langName}...`);

    try {
        // Use Gemini Flash for fast translation
        const result = await runCommand('gemini', ['-p', prompt]);

        // Extract JSON from response
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error('No JSON found in response');
    } catch (error) {
        console.error(`   ❌ Translation failed for ${lang}: ${error.message}`);
        return null;
    }
}

/**
 * Unflatten dot notation keys back to nested object
 */
function unflattenObject(flat) {
    const result = {};
    for (const [key, value] of Object.entries(flat)) {
        const parts = key.split('.');
        let current = result;
        for (let i = 0; i < parts.length - 1; i++) {
            if (!(parts[i] in current)) {
                current[parts[i]] = {};
            }
            current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = value;
    }
    return result;
}

/**
 * Deep merge two objects
 */
function deepMerge(target, source) {
    const result = { ...target };
    for (const [key, value] of Object.entries(source)) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            result[key] = deepMerge(result[key] || {}, value);
        } else {
            result[key] = value;
        }
    }
    return result;
}

/**
 * Update language file with new translations
 */
async function updateLangFile(lang, newTranslations, dryRun = false) {
    const filePath = path.join(MESSAGES_DIR, `${lang}.json`);

    // Load existing
    const content = await fs.readFile(filePath, 'utf-8');
    const existing = JSON.parse(content);

    // Merge new translations
    const updated = deepMerge(existing, unflattenObject(newTranslations));

    if (dryRun) {
        console.log(`   📄 Would update ${lang}.json with ${Object.keys(newTranslations).length} keys`);
        return;
    }

    // Write updated file
    await fs.writeFile(filePath, JSON.stringify(updated, null, 2) + '\n');
    console.log(`   ✅ Updated ${lang}.json with ${Object.keys(newTranslations).length} keys`);
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const langIndex = args.indexOf('--lang');
    const targetLang = langIndex !== -1 ? args[langIndex + 1] : null;

    console.log('🌐 Jarvis i18n Translation Tool\n');

    if (dryRun) {
        console.log('🔍 Dry run mode - no files will be modified\n');
    }

    const diffResults = await loadDiffResults();

    let totalTranslated = 0;

    for (const [lang, data] of Object.entries(diffResults)) {
        if (targetLang && lang !== targetLang) continue;
        if (!data.missing || Object.keys(data.missing).length === 0) continue;

        console.log(`\n📝 ${lang.toUpperCase()} (${Object.keys(data.missing).length} missing)`);

        const translated = await translateWithAgent(lang, data.missing);

        if (translated) {
            await updateLangFile(lang, translated, dryRun);
            totalTranslated += Object.keys(translated).length;
        }
    }

    if (totalTranslated > 0) {
        console.log(`\n✨ Translated ${totalTranslated} keys total`);
        if (!dryRun) {
            console.log(`   Run: node scripts/i18n-validate.mjs to verify`);
        }
    } else {
        console.log('\n✅ No translations needed or all translations failed');
    }
}

main().catch(console.error);
