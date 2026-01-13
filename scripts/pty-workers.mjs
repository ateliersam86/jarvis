#!/usr/bin/env node

/**
 * JARVIS CLI WORKERS - Using script command for PTY emulation
 * 
 * Uses macOS 'script' command to create a pseudo-terminal
 * that makes CLIs believe they are in interactive mode.
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

async function queryGeminiModels() {
    console.log('🔷 Querying Gemini CLI for models using script PTY...\n');

    const outputFile = '/tmp/gemini-models.txt';

    try {
        // Use 'script' to create a PTY and run gemini with /model command
        const cmd = `script -q ${outputFile} gemini -y << 'EOF'
/model
/quit
EOF`;

        await execAsync(cmd, { timeout: 15000 });

        // Read the output
        const output = await fs.readFile(outputFile, 'utf-8');
        console.log('Gemini output:\n', output);

        // Parse model names
        const models = parseModels(output, 'gemini');
        return models;
    } catch (error) {
        console.error('Gemini query failed:', error.message);
        return [];
    }
}

async function queryCodexModels() {
    console.log('🔶 Querying Codex CLI for models using script PTY...\n');

    const outputFile = '/tmp/codex-models.txt';

    try {
        // Use 'script' to create a PTY
        const cmd = `script -q ${outputFile} codex --help`;

        await execAsync(cmd, { timeout: 15000 });

        // Read the output
        const output = await fs.readFile(outputFile, 'utf-8');
        console.log('Codex output:\n', output);

        // Parse model names
        const models = parseModels(output, 'openai');
        return models;
    } catch (error) {
        console.error('Codex query failed:', error.message);
        return [];
    }
}

function parseModels(output, provider) {
    const models = new Set();

    // Gemini model patterns
    if (provider === 'gemini') {
        const patterns = [
            /gemini-[a-z0-9.-]+/gi,
            /gemini\s+3[.\s]+(pro|flash)[a-z0-9.-]*/gi
        ];

        for (const pattern of patterns) {
            const matches = output.match(pattern);
            if (matches) {
                matches.forEach(m => models.add(m.toLowerCase().trim()));
            }
        }
    }

    // OpenAI model patterns
    if (provider === 'openai') {
        const patterns = [
            /gpt-[a-z0-9.-]+/gi,
            /o[0-9]+-?[a-z-]*/gi,
            /chatgpt-[a-z0-9.-]+/gi
        ];

        for (const pattern of patterns) {
            const matches = output.match(pattern);
            if (matches) {
                matches.forEach(m => models.add(m.toLowerCase().trim()));
            }
        }
    }

    return [...models];
}

async function updateRegistry(geminiModels, openaiModels) {
    console.log('\n📝 Updating model registry...');
    console.log('Gemini models found:', geminiModels);
    console.log('OpenAI models found:', openaiModels);

    // Create registry content
    const registry = {
        gemini: geminiModels.length > 0 ? geminiModels : ['gemini-2.0-flash-exp', 'gemini-2.0-pro-exp'],
        openai: openaiModels.length > 0 ? openaiModels : ['gpt-4o-mini', 'gpt-4o', 'o1', 'o1-pro']
    };

    const yaml = `# Model Registry - Discovered from CLIs
# Last updated: ${new Date().toISOString()}

## Gemini Models
gemini:
${registry.gemini.map(m => `  - name: "${m}"`).join('\n')}

## OpenAI Models  
openai:
${registry.openai.map(m => `  - name: "${m}"`).join('\n')}

## Aliases
aliases:
  fast: "gemini:pro"
  smart: "gemini:pro"
  standard: "openai:codex"
  advanced: "openai:codex-max"

## Defaults
defaults:
  lint: "gemini:pro"
  test: "openai:codex"
  refactor: "gemini:pro"
  architecture: "gemini:pro"
`;

    const registryPath = path.join(process.cwd(), '.config', 'models.yaml');
    await fs.writeFile(registryPath, yaml);
    console.log(`\n✅ Registry updated: ${registryPath}`);
}

async function main() {
    console.log('🔍 JARVIS Model Discovery (PTY via script)\n');

    const [geminiModels, openaiModels] = await Promise.all([
        queryGeminiModels(),
        queryCodexModels()
    ]);

    await updateRegistry(geminiModels, openaiModels);

    console.log('\n✅ Discovery complete!');
}

main();
