#!/usr/bin/env node
/**
 * i18n-config.mjs - Shared configuration loader for i18n scripts
 * 
 * Loads settings from jarvis.config.json, supports user customization
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');

// Default configuration
const DEFAULT_CONFIG = {
    i18n: {
        enabled: true,
        sourceLang: 'fr',
        targetLangs: ['en', 'es', 'de', 'it', 'pt', 'ja', 'zh'],
        messagesDir: 'web/messages',
        watchMode: 'manual',
        autoCommit: false,
        translationModel: 'gemini:flash',
        validationLevel: 'strict'
    }
};

// Language display names
export const LANG_NAMES = {
    en: 'English',
    es: 'Spanish (Español)',
    de: 'German (Deutsch)',
    it: 'Italian (Italiano)',
    pt: 'Portuguese (Português)',
    ja: 'Japanese (日本語)',
    zh: 'Chinese Simplified (简体中文)',
    'zh-TW': 'Chinese Traditional (繁體中文)',
    ko: 'Korean (한국어)',
    ar: 'Arabic (العربية)',
    ru: 'Russian (Русский)',
    nl: 'Dutch (Nederlands)',
    pl: 'Polish (Polski)',
    sv: 'Swedish (Svenska)',
    da: 'Danish (Dansk)',
    fi: 'Finnish (Suomi)',
    no: 'Norwegian (Norsk)',
    tr: 'Turkish (Türkçe)',
    th: 'Thai (ไทย)',
    vi: 'Vietnamese (Tiếng Việt)',
    id: 'Indonesian (Bahasa Indonesia)',
    ms: 'Malay (Bahasa Melayu)',
    hi: 'Hindi (हिन्दी)',
    bn: 'Bengali (বাংলা)',
    uk: 'Ukrainian (Українська)',
    cs: 'Czech (Čeština)',
    el: 'Greek (Ελληνικά)',
    he: 'Hebrew (עברית)',
    hu: 'Hungarian (Magyar)',
    ro: 'Romanian (Română)'
};

/**
 * Load configuration from jarvis.config.json
 */
export function loadConfig() {
    const configPath = path.join(PROJECT_ROOT, 'jarvis.config.json');

    try {
        if (fs.existsSync(configPath)) {
            const userConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            // Deep merge with defaults
            return {
                ...DEFAULT_CONFIG,
                i18n: { ...DEFAULT_CONFIG.i18n, ...userConfig.i18n }
            };
        }
    } catch (error) {
        console.warn(`⚠️ Error loading jarvis.config.json: ${error.message}`);
        console.warn('   Using default configuration.\n');
    }

    return DEFAULT_CONFIG;
}

/**
 * Get the messages directory path
 */
export function getMessagesDir(config) {
    return path.join(PROJECT_ROOT, config.i18n.messagesDir);
}

/**
 * Get language display name
 */
export function getLangName(langCode) {
    return LANG_NAMES[langCode] || langCode.toUpperCase();
}

/**
 * Validate language code exists in supported list
 */
export function isValidLang(langCode) {
    return langCode in LANG_NAMES || langCode.length === 2;
}

/**
 * Print current configuration
 */
export function printConfig(config) {
    console.log('📋 Current i18n Configuration:');
    console.log(`   Source: ${config.i18n.sourceLang}`);
    console.log(`   Targets: ${config.i18n.targetLangs.join(', ')}`);
    console.log(`   Model: ${config.i18n.translationModel}`);
    console.log(`   Messages: ${config.i18n.messagesDir}`);
    console.log('');
}
