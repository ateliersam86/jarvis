#!/usr/bin/env node
// scripts/query-multi.mjs
// Query multiple AIs in parallel for consensus/brainstorming
import { spawn } from 'child_process';
import path from 'path';

const MODELS = {
    gemini: 'gemini:pro',
    claude: 'claude:sonnet',
    chatgpt: 'openai:codex'
};

async function queryModel(prompt, modelAlias, modelName) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const masterscript = spawn('node', [
            path.join(process.cwd(), 'scripts', 'masterscript.mjs'),
            prompt,
            '--model', modelName,
            '--noParse'
        ], {
            cwd: process.cwd(),
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let output = '';
        let error = '';

        masterscript.stdout.on('data', (data) => {
            output += data.toString();
        });

        masterscript.stderr.on('data', (data) => {
            error += data.toString();
        });

        masterscript.on('close', (code) => {
            const duration = ((Date.now() - startTime) / 1000).toFixed(1);
            resolve({
                model: modelAlias,
                modelName,
                success: code === 0,
                output: output.trim(),
                error: error.trim(),
                duration: `${duration}s`
            });
        });
    });
}

async function queryMultipleAIs(prompt, models = ['gemini', 'chatgpt']) {
    console.log(`\n🧠 Querying ${models.length} AIs in PARALLEL...\n`);
    console.log(`📝 Prompt: "${prompt.slice(0, 100)}..."\n`);
    console.log('─'.repeat(60));

    const queries = models.map(m => queryModel(prompt, m, MODELS[m]));
    const results = await Promise.allSettled(queries);

    console.log('\n' + '═'.repeat(60));
    console.log('📊 RESULTS SUMMARY');
    console.log('═'.repeat(60));

    for (const result of results) {
        if (result.status === 'fulfilled') {
            const r = result.value;
            console.log(`\n🤖 ${r.model.toUpperCase()} (${r.duration})`);
            console.log('─'.repeat(40));

            // Extract just the answer (skip Masterscript logs)
            const cleanOutput = r.output
                .split('📁 Project:').pop()
                ?.split('✅ Memory updated')[0]
                ?.trim() || r.output;

            console.log(cleanOutput.slice(0, 1000));
            if (cleanOutput.length > 1000) console.log('...[truncated]');
        } else {
            console.log(`\n❌ ${result.reason}`);
        }
    }

    console.log('\n' + '═'.repeat(60));
    return results.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean);
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('--help')) {
        console.log(`
🧠 MULTI-AI QUERY - Parallel Consultation

Usage:
  node scripts/query-multi.mjs "Your question" [--models gemini,chatgpt,claude]

Examples:
  node scripts/query-multi.mjs "How to improve this architecture?"
  node scripts/query-multi.mjs "Fix this bug" --models gemini,claude
  npm run multi -- "Best approach for caching?"
        `);
        process.exit(0);
    }

    // Parse --models flag
    const modelsIndex = args.indexOf('--models');
    let models = ['gemini', 'chatgpt']; // Default: 2 AIs

    if (modelsIndex !== -1 && args[modelsIndex + 1]) {
        models = args[modelsIndex + 1].split(',').filter(m => MODELS[m]);
        args.splice(modelsIndex, 2);
    }

    const prompt = args.join(' ');

    queryMultipleAIs(prompt, models)
        .then(() => process.exit(0))
        .catch((err) => {
            console.error('Error:', err);
            process.exit(1);
        });
}

export { queryMultipleAIs };
