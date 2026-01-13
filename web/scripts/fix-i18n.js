const fs = require('fs');
const path = require('path');

const MESSAGES_DIR = path.join(__dirname, '../messages');
const SOURCE_LOCALE = 'en';

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

function unflattenKeys(flatObj) {
    const result = {};
    for (const key in flatObj) {
        const parts = key.split('.');
        let current = result;
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (i === parts.length - 1) {
                current[part] = flatObj[key];
            } else {
                current[part] = current[part] || {};
                current = current[part];
            }
        }
    }
    return result;
}

function fixTranslations() {
    const sourcePath = path.join(MESSAGES_DIR, `${SOURCE_LOCALE}.json`);
    const sourceContent = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
    const sourceKeys = flattenKeys(sourceContent);
    const sourceKeySet = new Set(Object.keys(sourceKeys));

    const files = fs.readdirSync(MESSAGES_DIR).filter(f => f.endsWith('.json') && f !== `${SOURCE_LOCALE}.json`);

    files.forEach(file => {
        const filePath = path.join(MESSAGES_DIR, file);
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const targetKeys = flattenKeys(content);
        const targetKeySet = new Set(Object.keys(targetKeys));
        
        const missingKeys = [...sourceKeySet].filter(k => !targetKeySet.has(k));

        if (missingKeys.length > 0) {
            console.log(`Fixing ${file}: Adding ${missingKeys.length} missing keys...`);
            
            missingKeys.forEach(k => {
                // Use English value prefixed with [TODO] to indicate it needs translation
                // targetKeys[k] = `[TODO] ${sourceKeys[k]}`;
                // Or just use English value for now to keep UI functional
                targetKeys[k] = sourceKeys[k]; 
            });

            const newContent = unflattenKeys(targetKeys);
            fs.writeFileSync(filePath, JSON.stringify(newContent, null, 2));
        } else {
            console.log(`✓ ${file} is complete.`);
        }
    });
    
    console.log('Done.');
}

fixTranslations();
