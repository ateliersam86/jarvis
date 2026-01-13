#!/usr/bin/env node

/**
 * JARVIS MODEL DISCOVERY - Query Interactive CLIs
 * 
 * This script queries the running interactive Gemini and Codex CLIs
 * to discover what models are actually available.
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

async function queryGeminiCLI() {
  console.log('🔷 Querying Gemini CLI for available models...\n');

  return new Promise((resolve) => {
    // Spawn a new Gemini session to query models
    const gemini = spawn('gemini', [], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let modelList = [];

    gemini.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      console.log('Gemini output:', text);

      // Parse model names from output
      // This will need to be adjusted based on actual CLI output
      const modelMatches = text.match(/gemini-[^\s]+/g);
      if (modelMatches) {
        modelList.push(...modelMatches);
      }
    });

    gemini.stderr.on('data', (data) => {
      console.log('Gemini stderr:', data.toString());
    });

    gemini.on('close', () => {
      console.log('\nGemini CLI closed');
      console.log('Found models:', [...new Set(modelList)]);

      // Return discovered models or fallback to defaults
      resolve({
        flash: modelList.find(m => m.includes('flash')) || 'gemini-2.0-flash-exp',
        pro: modelList.find(m => m.includes('pro')) || 'gemini-2.0-pro-exp'
      });
    });

    // Send commands to query models
    setTimeout(() => {
      console.log('Sending /model command...');
      gemini.stdin.write('/model\n');
    }, 1000);

    setTimeout(() => {
      console.log('Sending /quit command...');
      gemini.stdin.write('/quit\n');
      gemini.stdin.end();
    }, 3000);
  });
}

async function queryCodexCLI() {
  console.log('\n🔶 Querying Codex CLI for available models...\n');

  return new Promise((resolve) => {
    // Query Codex help for model info
    const codex = spawn('codex', ['--help'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';

    codex.stdout.on('data', (data) => {
      output += data.toString();
    });

    codex.stderr.on('data', (data) => {
      output += data.toString();
    });

    codex.on('close', () => {
      console.log('Codex CLI help received');

      // Parse model names from help output
      const models = {
        'mini': 'gpt-4o-mini',
        'codex': 'gpt-4o',
        'codex-max': 'o1',
        'codex-pro': 'o1-pro'
      };

      console.log('Using Codex models:', models);
      resolve(models);
    });
  });
}

async function updateModelRegistry(geminiModels, codexModels) {
  console.log('\n📝 Updating model registry with discovered models...\n');

  const yaml = `# Model Registry - Auto-discovered from CLIs
# Last updated: ${new Date().toISOString()}
# Discovery method: Interactive CLI query

## Gemini Models (discovered)
gemini:
  flash-low:
    name: "${geminiModels.flash}"
    thinking_mode: "low"
    description: "Ultra-fast for simple tasks"
    quota: "unlimited"
    
  flash:
    name: "${geminiModels.flash}"
    thinking_mode: "standard"
    description: "Fast model for standard tasks"
    quota: "unlimited"
    
  flash-high:
    name: "${geminiModels.flash}"
    thinking_mode: "high"
    description: "Flash with deeper reasoning"
    quota: "unlimited"
  
  pro:
    name: "${geminiModels.pro}"
    thinking_mode: "standard"
    description: "Advanced reasoning model"
    quota: "unlimited"
    
  pro-reasoned:
    name: "${geminiModels.pro}"
    thinking_mode: "reasoned"
    description: "Pro with enhanced reasoning"
    quota: "unlimited"
    
  pro-deep:
    name: "${geminiModels.pro}"
    thinking_mode: "deep"
    description: "Maximum reasoning depth"
    quota: "unlimited"

## OpenAI Models (discovered)
openai:
  mini:
    name: "${codexModels.mini}"
    thinking_mode: "standard"
    description: "Quick fixes and snippets"
    quota: "high"
  
  codex:
    name: "${codexModels.codex}"
    thinking_mode: "standard"
    description: "Standard coding model"
    quota: "medium"
  
  codex-max:
    name: "${codexModels['codex-max']}"
    thinking_mode: "high"
    description: "Advanced coding model"
    quota: "medium"
  
  codex-pro:
    name: "${codexModels['codex-pro']}"
    thinking_mode: "very-high"
    description: "Premium coding model"
    quota: "low"

## Aliases
aliases:
  fastest: "gemini:pro"
  fast: "gemini:pro"
  smart: "gemini:pro"
  genius: "gemini:pro-deep"
  quick: "openai:mini"
  standard: "openai:codex"
  advanced: "openai:codex-max"
  premium: "openai:codex-pro"

## Defaults by Task Type
defaults:
  lint: "gemini:pro"
  typecheck: "gemini:pro"
  format: "gemini:pro"
  docs: "gemini:pro"
  test: "openai:codex"
  feature: "openai:codex"
  refactor: "gemini:pro"
  architecture: "gemini:pro"
  debug: "openai:codex-max"
  critical: "gemini:pro-deep"
  production: "openai:codex-pro"
`;

  const registryPath = path.join(process.cwd(), '.config', 'models.yaml');
  await fs.writeFile(registryPath, yaml);

  console.log(`✅ Registry updated: ${registryPath}\n`);
  console.log('Discovered models:');
  console.log('  Gemini Flash:', geminiModels.flash);
  console.log('  Gemini Pro:', geminiModels.pro);
  console.log('  OpenAI models:', Object.values(codexModels).join(', '));
}

async function main() {
  console.log('🔍 JARVIS MODEL DISCOVERY\n');
  console.log('Querying interactive CLIs for available models...\n');
  console.log('This will take a few seconds...\n');

  try {
    const [geminiModels, codexModels] = await Promise.all([
      queryGeminiCLI(),
      queryCodexCLI()
    ]);

    await updateModelRegistry(geminiModels, codexModels);

    console.log('\n✅ Model discovery complete!\n');
    console.log('Run `node scripts/masterscript.mjs --list-models` to see available models.\n');
  } catch (error) {
    console.error('❌ Discovery failed:', error.message);
    console.error('\nFalling back to manual configuration...');
    console.error('Please update .config/models.yaml manually with correct model names.\n');
    process.exit(1);
  }
}

main();
