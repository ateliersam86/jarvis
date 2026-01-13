#!/usr/bin/env node
/**
 * i18n-watcher.mjs - Watches for changes in translation files and auto-translates
 * 
 * Usage:
 *   node scripts/i18n-watcher.mjs              # Watch mode
 *   node scripts/i18n-watcher.mjs --once       # Single check, no watch
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = path.join(__dirname, '../web/messages');
const SOURCE_FILE = path.join(MESSAGES_DIR, 'fr.json');

// Debounce timeout (ms)
const DEBOUNCE_MS = 2000;
let debounceTimer = null;
let isProcessing = false;

/**
 * Run a script and return output
 */
function runScript(scriptName, args = []) {
    return new Promise((resolve, reject) => {
        const proc = spawn('node', [`scripts/${scriptName}`, ...args], {
            cwd: path.join(__dirname, '..'),
            stdio: ['inherit', 'pipe', 'pipe']
        });

        let output = '';
        proc.stdout.on('data', (data) => {
            const str = data.toString();
            output += str;
            process.stdout.write(str);
        });
        proc.stderr.on('data', (data) => {
            process.stderr.write(data.toString());
        });
        proc.on('close', (code) => {
            if (code === 0) resolve(output);
            else reject(new Error(`Script failed with code ${code}`));
        });
    });
}

/**
 * Process changes in translation files
 */
async function processChanges() {
    if (isProcessing) {
        console.log('⏳ Already processing, skipping...\n');
        return;
    }

    isProcessing = true;
    console.log('\n' + '═'.repeat(60));
    console.log('🔄 Change detected! Processing...');
    console.log('═'.repeat(60) + '\n');

    try {
        // 1. Run diff to find missing keys
        console.log('📊 Step 1: Checking for missing keys...\n');
        await runScript('i18n-diff.mjs');

        // Check if translations needed
        const diffCachePath = path.join(__dirname, '../.cache/i18n-diff.json');
        if (fs.existsSync(diffCachePath)) {
            const diffData = JSON.parse(fs.readFileSync(diffCachePath, 'utf-8'));
            const totalMissing = Object.values(diffData)
                .reduce((sum, r) => sum + (r.missingCount || 0), 0);

            if (totalMissing > 0) {
                // 2. Translate missing keys
                console.log('\n📝 Step 2: Translating missing keys...\n');
                await runScript('i18n-translate.mjs');

                // 3. Validate translations
                console.log('\n✅ Step 3: Validating translations...\n');
                await runScript('i18n-validate.mjs');

                console.log('\n' + '═'.repeat(60));
                console.log('✨ Translation pipeline complete!');
                console.log('═'.repeat(60) + '\n');
            }
        }
    } catch (error) {
        console.error('\n❌ Error in translation pipeline:', error.message);
    } finally {
        isProcessing = false;
    }
}

/**
 * Debounced change handler
 */
function handleChange(eventType, filename) {
    if (!filename || !filename.endsWith('.json')) return;

    // Only react to source file changes
    if (filename !== 'fr.json') {
        console.log(`ℹ️  Ignoring change in ${filename} (not source)`);
        return;
    }

    console.log(`📄 Detected ${eventType} in ${filename}`);

    // Debounce rapid changes
    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
        processChanges();
    }, DEBOUNCE_MS);
}

/**
 * Start watching
 */
function startWatcher() {
    console.log('👁️  Jarvis i18n Watcher\n');
    console.log(`📁 Watching: ${MESSAGES_DIR}/fr.json`);
    console.log('📝 Will auto-translate when changes detected\n');
    console.log('Press Ctrl+C to stop\n');
    console.log('─'.repeat(60) + '\n');

    // Initial check
    processChanges();

    // Watch for changes
    fs.watch(MESSAGES_DIR, { persistent: true }, handleChange);
}

// Main
const args = process.argv.slice(2);
const onceMode = args.includes('--once');

if (onceMode) {
    console.log('🔍 Running single check...\n');
    processChanges().then(() => {
        console.log('\n✅ Done');
        process.exit(0);
    });
} else {
    startWatcher();
}
