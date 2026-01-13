#!/usr/bin/env node

/**
 * JARVIS MODEL QUERY - Ask Masterscript to query interactive CLIs
 * 
 * This script asks the running Gemini and Codex terminals
 * what models they have available.
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

console.log('🔍 Querying Masterscript for available models...\n');
console.log('This will ask the interactive CLIs directly.\n');

// Query Gemini via Masterscript
console.log('📝 Asking Gemini CLI: "What models do you have available? List all model names."\n');

const geminiQuery = spawn('node', ['scripts/masterscript.mjs', 'What models do you have available? List all model names with their exact identifiers.', '--model', 'gemini:pro'], {
    cwd: process.cwd(),
    stdio: 'inherit'
});

geminiQuery.on('close', (code) => {
    console.log('\n✅ Gemini query complete\n');

    // Query Codex via Masterscript
    console.log('📝 Asking Codex CLI: "What models do you have available? List all model names."\n');

    const codexQuery = spawn('node', ['scripts/masterscript.mjs', 'What models do you have available? List all model names with their exact identifiers.', '--model', 'openai:codex'], {
        cwd: process.cwd(),
        stdio: 'inherit'
    });

    codexQuery.on('close', (code) => {
        console.log('\n✅ Codex query complete\n');
        console.log('Please check the responses above and update .config/models.yaml with the correct model names.\n');
    });
});
