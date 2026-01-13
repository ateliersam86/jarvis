const fs = require('fs');
const path = require('path');

const MESSAGES_DIR = path.join(__dirname, '../messages');
const SOURCE_LOCALE = 'en';

// Heuristic: Warn if translation is > 2x length of source (for source > 10 chars)
const LENGTH_THRESHOLD_MULTIPLIER = 2.0;
const MIN_LENGTH_FOR_CHECK = 10;

function flattenKeys(obj, prefix = '') {
    let keys = {};
    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            Object.assign(keys, flattenKeys(obj[key], prefix + key + '.'));
        } else {
            keys[prefix + key] = obj[key];
        }
    }
    return keys;
}

function validateTranslations() {
    const sourcePath = path.join(MESSAGES_DIR, `${SOURCE_LOCALE}.json`);
    if (!fs.existsSync(sourcePath)) {
        console.error(`Source locale file not found: ${sourcePath}`);
        process.exit(1);
    }

    const sourceContent = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
    const sourceKeys = flattenKeys(sourceContent);
    const sourceKeySet = new Set(Object.keys(sourceKeys));

    const files = fs.readdirSync(MESSAGES_DIR).filter(f => f.endsWith('.json') && f !== `${SOURCE_LOCALE}.json`);
    let hasErrors = false;
    let warnings = [];

    console.log(`Validating translations against source: ${SOURCE_LOCALE}\n`);

    files.forEach(file => {
        const locale = file.replace('.json', '');
        const filePath = path.join(MESSAGES_DIR, file);
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const targetKeys = flattenKeys(content);
        const targetKeySet = new Set(Object.keys(targetKeys));

        console.log(`Checking ${locale}...`);

        // Check for missing keys
        const missingKeys = [...sourceKeySet].filter(k => !targetKeySet.has(k));
        if (missingKeys.length > 0) {
            console.error(`  ❌ Missing keys in ${locale}:`);
            missingKeys.forEach(k => console.error(`     - ${k}`));
            hasErrors = true;
        }

        // Check for extra keys
        const extraKeys = [...targetKeySet].filter(k => !sourceKeySet.has(k));
        if (extraKeys.length > 0) {
            console.warn(`  ⚠️  Extra keys in ${locale} (not in source):`);
            extraKeys.forEach(k => console.warn(`     - ${k}`));
        }

        // Check for length heuristics
        Object.keys(targetKeys).forEach(key => {
            if (sourceKeys[key] && targetKeys[key]) {
                const sourceLen = String(sourceKeys[key]).length;
                const targetLen = String(targetKeys[key]).length;

                if (sourceLen > MIN_LENGTH_FOR_CHECK && targetLen > sourceLen * LENGTH_THRESHOLD_MULTIPLIER) {
                    warnings.push(`  ⚠️  Potential overflow in ${locale} [${key}]: Source(${sourceLen}) vs Target(${targetLen})`);
                    // warnings.push(`      Source: "${sourceKeys[key]}"`);
                    // warnings.push(`      Target: "${targetKeys[key]}"`);
                }
            }
        });

        if (missingKeys.length === 0 && extraKeys.length === 0) {
            console.log(`  ✅ Keys match.`);
        }
    });

    if (warnings.length > 0) {
        console.log('\nWarnings (Potential Layout Issues):');
        warnings.forEach(w => console.log(w));
    }

    if (hasErrors) {
        console.error('\n❌ Validation failed. Missing keys found.');
        process.exit(1);
    } else {
        console.log('\n✅ Translation validation passed.');
    }
}

validateTranslations();
