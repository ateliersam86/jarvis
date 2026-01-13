#!/usr/bin/env node

/**
 * JARVIS MASTERSCRIPT - CLI Orchestration with Model Registry
 * 
 * Architecture:
 * Opus (AG) → MasterScript → Model Registry → Interactive CLI → Results → Opus
 * 
 * Rules:
 * - Opus DECIDES using model aliases (gemini:flash, openai:codex, etc.)
 * - MasterScript TRANSLATES aliases to real model names
 * - CLIs EXECUTE with the correct model
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';

// Load model registry
let MODEL_REGISTRY = null;
let CONTEXT_MAP = null;

async function loadModelRegistry() {
    if (MODEL_REGISTRY) return MODEL_REGISTRY;

    try {
        const registryPath = path.join(process.cwd(), '.config', 'models.yaml');
        const content = await fs.readFile(registryPath, 'utf-8');
        MODEL_REGISTRY = yaml.load(content);
        return MODEL_REGISTRY;
    } catch (error) {
        console.error('Failed to load model registry:', error.message);
        process.exit(1);
    }
}

// Load context map for structured job creation
async function loadContextMap() {
    if (CONTEXT_MAP) return CONTEXT_MAP;

    try {
        const mapPath = path.join(process.cwd(), '.memory', 'context_map.json');
        const content = await fs.readFile(mapPath, 'utf-8');
        CONTEXT_MAP = JSON.parse(content);
        return CONTEXT_MAP;
    } catch (error) {
        console.warn('⚠️ No context map found. Run: node scripts/indexer.mjs');
        return null;
    }
}

// Load vocabulary for synonym resolution
let VOCABULARY = null;

async function loadVocabulary() {
    if (VOCABULARY) return VOCABULARY;

    try {
        const vocabPath = path.join(process.cwd(), '.config', 'vocabulary.yaml');
        const content = await fs.readFile(vocabPath, 'utf-8');
        VOCABULARY = yaml.load(content);
        return VOCABULARY;
    } catch (error) {
        console.warn('⚠️ No vocabulary file found');
        return null;
    }
}

// Load agent-specific directives from .config/agents/ files
const AGENT_DIRECTIVES_CACHE = {};

async function loadAgentDirectives(provider) {
    if (AGENT_DIRECTIVES_CACHE[provider]) return AGENT_DIRECTIVES_CACHE[provider];

    // Agent configs in .config/agents/ (named agent-*.md to avoid AG auto-reading)
    const fileMap = {
        'gemini': '.config/agents/agent-gemini.md',
        'claude': '.config/agents/agent-claude.md',
        'codex': '.config/agents/agent-codex.md',
        'openai': '.config/agents/agent-codex.md'
    };

    const filename = fileMap[provider];
    if (!filename) return null;

    try {
        const filePath = path.join(process.cwd(), filename);
        const content = await fs.readFile(filePath, 'utf-8');
        AGENT_DIRECTIVES_CACHE[provider] = content;
        return content;
    } catch (error) {
        // Silently fail if file doesn't exist
        return null;
    }
}

// Fallback chains for each provider
const FALLBACK_CHAINS = {
    'gemini': ['claude', 'openai'],
    'claude': ['gemini', 'openai'],
    'openai': ['claude', 'gemini']
};

// Check if CLI is available
async function isCliAvailable(cli) {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    try {
        await execAsync(`which ${cli}`);
        return true;
    } catch {
        return false;
    }
}

// Get available provider with fallback
async function getAvailableProvider(preferredProvider) {
    const cliMap = {
        'gemini': 'gemini',
        'claude': 'claude',
        'openai': 'codex'
    };

    // Check preferred first
    if (await isCliAvailable(cliMap[preferredProvider])) {
        return preferredProvider;
    }

    // Try fallbacks
    const fallbacks = FALLBACK_CHAINS[preferredProvider] || [];
    for (const fallback of fallbacks) {
        if (await isCliAvailable(cliMap[fallback])) {
            console.log(`⚠️ ${preferredProvider} unavailable, falling back to ${fallback}`);
            return fallback;
        }
    }

    // No CLI available
    console.error(`❌ No CLI available for ${preferredProvider} or fallbacks`);
    return null;
}

// Enhance prompt with agent directives
async function enhancePromptWithDirectives(prompt, provider) {
    const directives = await loadAgentDirectives(provider);
    if (!directives) return prompt;

    return `## Agent Directives
${directives}

---

## Task
${prompt}`;
}

// Parse intent using Gemini Flash (Stage 1)
async function parseIntent(prompt) {
    const contextMap = await loadContextMap();
    const vocabulary = await loadVocabulary();

    // Build the parser prompt
    const parserPrompt = `You are an intent parser for a code project. Analyze the user request and output ONLY valid JSON.

## Project Structure
${JSON.stringify(contextMap?.structure || {}, null, 2)}

## Database Models
${JSON.stringify(contextMap?.database || {}, null, 2)}

## Vocabulary (synonyms)
${JSON.stringify(vocabulary || {}, null, 2)}

## User Request
"${prompt}"

## Output (JSON only, no markdown)
{
  "intent": "add_feature|modify|modify_style|fix_bug|refactor|explain|delete",
  "target": {
    "files": ["exact file paths from structure"],
    "dbModels": ["model names if DB related"],
    "functions": ["function/component names mentioned"]
  },
  "action": {
    "type": "specific action type",
    "description": "what exactly to do"
  },
  "confidence": 0.0-1.0,
  "ambiguities": ["list any unclear aspects"]
}`;

    try {
        // Use Gemini Flash for fast parsing
        const result = await executeViaGeminiDirect(parserPrompt, 'gemini-3-flash-preview');

        // Extract JSON from response
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            console.log(`\n🎯 Intent: ${parsed.intent} (confidence: ${(parsed.confidence * 100).toFixed(0)}%)`);
            return parsed;
        }
    } catch (error) {
        console.warn('⚠️ Intent parsing failed, using fallback');
    }

    // Fallback: basic keyword matching
    return createFallbackIntent(prompt);
}

// Fallback intent parser (no AI)
function createFallbackIntent(prompt) {
    const lowerPrompt = prompt.toLowerCase();

    let intent = 'modify';
    if (lowerPrompt.includes('ajoute') || lowerPrompt.includes('add') || lowerPrompt.includes('crée')) {
        intent = 'add_feature';
    } else if (lowerPrompt.includes('corrige') || lowerPrompt.includes('fix') || lowerPrompt.includes('bug')) {
        intent = 'fix_bug';
    } else if (lowerPrompt.includes('style') || lowerPrompt.includes('design') || lowerPrompt.includes('css')) {
        intent = 'modify_style';
    } else if (lowerPrompt.includes('refactor')) {
        intent = 'refactor';
    }

    return {
        intent,
        target: { files: [], dbModels: [], functions: [] },
        action: { type: intent, description: prompt },
        confidence: 0.5,
        ambiguities: ['Fallback parser used - lower confidence']
    };
}

// Validate job and check for ambiguities
function validateJob(parsedIntent, options = {}) {
    const issues = [];

    if (parsedIntent.confidence < 0.7) {
        issues.push(`Low confidence: ${(parsedIntent.confidence * 100).toFixed(0)}%`);
    }

    if (parsedIntent.target.files.length === 0) {
        issues.push('No target files identified');
    }

    if (parsedIntent.ambiguities && parsedIntent.ambiguities.length > 0) {
        issues.push(...parsedIntent.ambiguities);
    }

    if (issues.length > 0 && !options.force) {
        console.log('\n⚠️ Potential issues detected:');
        issues.forEach(i => console.log(`   - ${i}`));
    }

    return {
        valid: issues.length === 0 || options.force,
        issues
    };
}

// Enrich context by loading actual file contents for targets
async function enrichContext(parsedIntent) {
    const enriched = { ...parsedIntent, fileContents: {} };

    for (const file of parsedIntent.target.files.slice(0, 3)) { // Max 3 files
        try {
            const fullPath = path.join(process.cwd(), file);
            const content = await fs.readFile(fullPath, 'utf-8');
            enriched.fileContents[file] = content.substring(0, 2000); // First 2000 chars
        } catch (e) {
            // File not found, skip
        }
    }

    return enriched;
}

// Direct Gemini execution (for intent parsing only)
async function executeViaGeminiDirect(prompt, modelName) {
    return new Promise((resolve, reject) => {
        const gemini = spawn('gemini', ['-m', modelName, '-y'], {
            cwd: process.cwd(),
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env, GEMINI_MODEL: modelName }
        });

        let output = '';
        let errorOutput = '';

        gemini.stdout.on('data', (data) => { output += data.toString(); });
        gemini.stderr.on('data', (data) => { errorOutput += data.toString(); });

        gemini.stdin.write(prompt);
        gemini.stdin.end();

        gemini.on('close', (code) => {
            if (code === 0) {
                resolve(output);
            } else {
                reject(new Error(errorOutput || 'Gemini execution failed'));
            }
        });
    });
}

// Find relevant files for a given prompt using context map
async function findRelevantFiles(prompt) {
    const contextMap = await loadContextMap();
    if (!contextMap) return [];

    const lowerPrompt = prompt.toLowerCase();
    const relevantFiles = [];

    // Keywords to file categories mapping
    const categoryKeywords = {
        pages: ['page', 'route', 'home', 'dashboard', 'memory'],
        components: ['component', 'ui', 'button', 'card', 'panel', 'chat', 'grid', 'selector'],
        api: ['api', 'endpoint', 'route', 'fetch', 'post', 'get', 'quota', 'status'],
        lib: ['lib', 'util', 'helper', 'config', 'oauth', 'redis'],
        scripts: ['script', 'masterscript', 'indexer', 'healer', 'worker']
    };

    // Check each category
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(kw => lowerPrompt.includes(kw))) {
            const files = contextMap.structure[category] || [];
            relevantFiles.push(...files);
        }
    }

    // Check for specific file mentions
    const allFiles = [
        ...contextMap.structure.pages,
        ...contextMap.structure.components,
        ...contextMap.structure.api,
        ...contextMap.structure.lib,
        ...(contextMap.structure.scripts || [])
    ];

    for (const file of allFiles) {
        const basename = path.basename(file).toLowerCase().replace(/\.(tsx?|jsx?|mjs)$/, '');
        if (lowerPrompt.includes(basename)) {
            if (!relevantFiles.includes(file)) {
                relevantFiles.push(file);
            }
        }
    }

    // Check DB model mentions
    for (const model of contextMap.database.models) {
        if (lowerPrompt.includes(model.toLowerCase())) {
            relevantFiles.push('web/prisma/schema.prisma');
            break;
        }
    }

    return [...new Set(relevantFiles)]; // Deduplicate
}

// Create a structured job from natural language prompt
async function createStructuredJob(prompt, options = {}) {
    const relevantFiles = await findRelevantFiles(prompt);
    const contextMap = await loadContextMap();

    const job = {
        timestamp: new Date().toISOString(),
        prompt: prompt,
        target: {
            files: relevantFiles,
            dbModels: contextMap?.database.models.filter(m =>
                prompt.toLowerCase().includes(m.toLowerCase())
            ) || []
        },
        context: {
            totalFiles: relevantFiles.length,
            hasDbChange: relevantFiles.includes('web/prisma/schema.prisma'),
            projectStructure: contextMap ? {
                pageCount: contextMap.structure.pages.length,
                componentCount: contextMap.structure.components.length,
                apiCount: (contextMap.structure.api || []).length
            } : null
        },
        options: options
    };

    if (relevantFiles.length > 0) {
        console.log(`📂 Context: Found ${relevantFiles.length} relevant file(s)`);
        relevantFiles.forEach(f => console.log(`   → ${f}`));
    }

    return job;
}

// Resolve model alias to real model name
async function resolveModel(alias) {
    const registry = await loadModelRegistry();

    // Check if it's an alias
    if (registry.aliases[alias]) {
        alias = registry.aliases[alias];
    }

    // Parse provider:model format
    const [provider, modelKey] = alias.split(':');

    if (!registry[provider] || !registry[provider][modelKey]) {
        throw new Error(`Unknown model alias: ${alias}`);
    }

    return {
        provider,
        modelKey,
        modelName: registry[provider][modelKey].name,
        description: registry[provider][modelKey].description
    };
}

// Get default model for task type
async function getDefaultModel(taskType) {
    const registry = await loadModelRegistry();
    return registry.defaults[taskType] || 'gemini:pro';
}

// Detect workspace and project
async function detectProject() {
    const cwd = process.cwd();

    try {
        const projectsPath = path.join(cwd, '.memory', 'projects.json');
        const projectsData = await fs.readFile(projectsPath, 'utf-8');
        const { projects } = JSON.parse(projectsData);

        const project = projects.find(p =>
            p.workspace.mac === cwd || p.workspace.windows === cwd
        );

        if (project) {
            console.log(`📁 Project: ${project.name} (${project.id})`);
            return project.id;
        }
    } catch (e) {
        console.warn('⚠️  Using jarvis as default project');
    }

    return 'jarvis';
}

// Update memory after task
async function updateMemory(projectId, workerId, taskData) {
    try {
        const memoryPath = path.join(process.cwd(), '.memory', 'projects', projectId, `${workerId}.json`);

        let memory;
        try {
            const data = await fs.readFile(memoryPath, 'utf-8');
            memory = JSON.parse(data);
        } catch (e) {
            memory = {
                workerId,
                modelId: taskData.model || 'unknown',
                status: 'online',
                lastActive: new Date().toISOString(),
                totalTasks: 0,
                successRate: 1.0,
                recentTasks: [],
                expertise: {},
                context: { lastFiles: [], lastTopics: [], knownIssues: [] },
                performance: { averageResponseTime: 0, totalTokensUsed: 0, errorRate: 0 }
            };
        }

        memory.lastActive = new Date().toISOString();
        memory.totalTasks += 1;

        const totalSuccess = memory.totalTasks * memory.successRate + (taskData.success ? 1 : 0);
        memory.successRate = totalSuccess / memory.totalTasks;

        memory.recentTasks.unshift(taskData);
        if (memory.recentTasks.length > 10) {
            memory.recentTasks = memory.recentTasks.slice(0, 10);
        }

        if (taskData.type) {
            memory.expertise[taskData.type] = (memory.expertise[taskData.type] || 0) + 1;
        }

        if (taskData.responseTime) {
            const totalTime = memory.performance.averageResponseTime * (memory.totalTasks - 1) + taskData.responseTime;
            memory.performance.averageResponseTime = Math.round(totalTime / memory.totalTasks);
        }

        if (!taskData.success) {
            const totalErrors = memory.performance.errorRate * (memory.totalTasks - 1) + 1;
            memory.performance.errorRate = totalErrors / memory.totalTasks;
        }

        await fs.writeFile(memoryPath, JSON.stringify(memory, null, 4));
        console.log(`✅ Memory updated`);

        // Also sync with Dashboard API if available
        await syncWithDashboard(projectId, workerId, taskData);

    } catch (error) {
        console.error('Failed to update memory:', error.message);
    }
}

// Sync task with Dashboard API for real-time updates
async function syncWithDashboard(projectId, workerId, taskData) {
    const JARVIS_API = process.env.JARVIS_API_URL || 'https://jarvis.atelier-sam.fr';

    // Load token from config
    let token = null;
    try {
        const configPath = path.join(os.homedir(), '.jarvis', 'config.json');
        const configData = await fs.readFile(configPath, 'utf-8');
        const config = JSON.parse(configData);
        token = config.token;
    } catch {
        // No config file, skip sync
    }

    if (!token) {
        // Not logged in, skip silently
        return;
    }

    // First sync the project
    const cwd = process.cwd();
    let pkgName = projectId;
    try {
        const pkgPath = path.join(cwd, 'package.json');
        const pkgData = await fs.readFile(pkgPath, 'utf-8');
        const pkg = JSON.parse(pkgData);
        pkgName = pkg.name || path.basename(cwd);
    } catch {
        pkgName = path.basename(cwd);
    }

    try {
        // Sync project
        const projResponse = await fetch(`${JARVIS_API}/api/v1/projects/sync`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: pkgName,
                localPath: cwd,
            }),
            signal: AbortSignal.timeout(5000)
        });

        if (!projResponse.ok) {
            return;
        }

        const projData = await projResponse.json();

        // Sync task
        await fetch(`${JARVIS_API}/api/v1/tasks/sync`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                projectId: projData.project?.id,
                tasks: [{
                    title: taskData.input?.slice(0, 100) || 'Task',
                    description: `${workerId}: ${taskData.output?.slice(0, 200) || ''}`,
                    status: taskData.success ? 'COMPLETED' : 'PENDING',
                }]
            }),
            signal: AbortSignal.timeout(5000)
        });

        console.log(`🔄 Dashboard synced`);

    } catch {
        // Silent fail - dashboard sync is optional
    }
}


// Execute via Gemini CLI
async function executeViaGemini(prompt, modelName, options = {}) {
    console.log(`\n🔷 Gemini CLI (${modelName})...\n`);

    const startTime = Date.now();
    const projectId = await detectProject();

    // Enhance prompt with agent directives from GEMINI.md
    const enhancedPrompt = await enhancePromptWithDirectives(prompt, 'gemini');

    return new Promise((resolve, reject) => {
        const gemini = spawn('gemini', ['-y'], {
            cwd: process.cwd(),
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env, GEMINI_MODEL: modelName }
        });

        let output = '';
        let errorOutput = '';

        gemini.stdout.on('data', (data) => {
            const text = data.toString();
            output += text;
            if (!options.silent) process.stdout.write(text);
        });

        gemini.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        gemini.on('close', async (code) => {
            const responseTime = Date.now() - startTime;
            const success = code === 0;

            await updateMemory(projectId, 'gemini', {
                taskId: `cli-${Date.now()}`,
                timestamp: new Date().toISOString(),
                type: options.taskType || 'general',
                input: prompt,
                output: output.substring(0, 10000), // Max 10KB to prevent JSON bloat
                success,
                responseTime,
                model: modelName,
                filesModified: []
            });

            if (success) {
                console.log('\n✅ Completed\n');
                resolve({ success: true, output, error: errorOutput });
            } else {
                console.error('\n❌ Failed\n');
                reject(new Error(errorOutput || 'Unknown error'));
            }
        });

        gemini.stdin.write(enhancedPrompt + '\n');
        gemini.stdin.end();
    });
}

// Execute via Codex CLI
async function executeViaCodex(prompt, modelName, options = {}) {
    console.log(`\n🔶 Codex CLI (${modelName})...\n`);

    const startTime = Date.now();
    const projectId = await detectProject();

    // Enhance prompt with agent directives from CODEX.md
    const enhancedPrompt = await enhancePromptWithDirectives(prompt, 'codex');

    return new Promise((resolve, reject) => {
        // Use python3 pty to simulate TTY for Codex
        // We construct the python command string carefully
        const pythonScript = `import pty; pty.spawn(['codex', '-m', '${modelName}', '--dangerously-bypass-approvals-and-sandbox'])`;

        const codex = spawn('python3', ['-c', pythonScript], {
            cwd: process.cwd(),
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let output = '';
        let errorOutput = '';

        codex.stdout.on('data', (data) => {
            const text = data.toString();
            output += text;
            if (!options.silent) process.stdout.write(text);
        });

        codex.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        codex.on('close', async (code) => {
            const responseTime = Date.now() - startTime;
            const success = code === 0;

            // Clean up output (remove escape codes)
            const cleanOutput = output.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '').trim();

            await updateMemory(projectId, 'chatgpt', {
                taskId: `cli-${Date.now()}`,
                timestamp: new Date().toISOString(),
                type: options.taskType || 'general',
                input: prompt,
                output: cleanOutput.substring(0, 10000), // Max 10KB to prevent JSON bloat
                success,
                responseTime,
                model: modelName,
                filesModified: []
            });

            if (success) {
                console.log('\n✅ Completed\n');
                resolve({ success: true, output, error: errorOutput });
            } else {
                console.error('\n❌ Failed\n');
                reject(new Error(errorOutput || 'Unknown error'));
            }
        });

        codex.stdin.write(prompt + '\n');
        codex.stdin.end();
    });
}

// Execute via Claude CLI
async function executeViaClaude(prompt, modelName, options = {}) {
    console.log(`\n🟣 Claude CLI (${modelName})...\n`);

    const startTime = Date.now();
    const projectId = await detectProject();

    const args = [
        '--model', modelName,
        '--allowed-tools', 'View,Edit,Write,Bash,Glob,Grep',
        '--print',
        '--dangerously-skip-permissions'
    ];

    return new Promise((resolve, reject) => {
        const claude = spawn('claude', [...args, prompt], {
            stdio: ['pipe', 'pipe', 'pipe'],
            cwd: process.cwd()
        });

        let output = '';
        let errorOutput = '';

        claude.stdout.on('data', (data) => {
            const text = data.toString();
            process.stdout.write(text);
            output += text;
        });

        claude.stderr.on('data', (data) => {
            const text = data.toString();
            process.stderr.write(text);
            errorOutput += text;
        });

        claude.on('close', async (code) => {
            const success = code === 0;
            const responseTime = Date.now() - startTime;

            // Update memory
            await updateMemory(projectId, 'claude', {
                taskId: `cli-${Date.now()}`,
                timestamp: new Date().toISOString(),
                type: options.taskType || 'general',
                input: prompt.slice(0, 500),
                output: output.slice(0, 500),
                success,
                responseTime,
                model: modelName,
                filesModified: []
            });

            if (success) {
                console.log('\n✅ Completed\n');
                resolve({ success: true, output, error: errorOutput });
            } else {
                console.error('\n❌ Failed\n');
                reject(new Error(errorOutput || 'Unknown error'));
            }
        });
    });
}

// Main delegate function
async function delegate(prompt, options = {}) {
    try {
        let activePrompt = prompt;

        // Stage 1: Intent Analysis & Enrichment (unless disabled)
        if (!options.noParse) {
            const parsedIntent = await parseIntent(prompt);
            const validation = validateJob(parsedIntent, options);

            if (validation.valid) {
                const enriched = await enrichContext(parsedIntent);

                // Inject file contents into prompt for better context if available
                if (Object.keys(enriched.fileContents).length > 0) {
                    activePrompt = `${prompt}\n\nRelevant Context:\n`;
                    for (const [file, content] of Object.entries(enriched.fileContents)) {
                        activePrompt += `\n--- ${file} ---\n${content}\n`;
                    }
                }
            }
        }

        // Resolve model
        const modelAlias = options.model || await getDefaultModel(options.taskType || 'general');
        let { provider, modelName, description } = await resolveModel(modelAlias);

        // Check if provider is available, use fallback if not
        const availableProvider = await getAvailableProvider(provider);
        if (!availableProvider) {
            throw new Error(`No CLI available for ${provider} or any fallback`);
        }

        // If we're using a fallback, re-resolve the model
        if (availableProvider !== provider) {
            const fallbackAlias = `${availableProvider}:${availableProvider === 'openai' ? 'codex' : 'sonnet'}`;
            const resolved = await resolveModel(fallbackAlias);
            provider = resolved.provider;
            modelName = resolved.modelName;
            description = `${resolved.description} (fallback)`;
        }

        console.log(`🤖 Using: ${modelAlias} (${description})`);

        // Execute via appropriate CLI
        if (provider === 'gemini') {
            return await executeViaGemini(activePrompt, modelName, options);
        } else if (provider === 'openai') {
            return await executeViaCodex(activePrompt, modelName, options);
        } else if (provider === 'claude') {
            return await executeViaClaude(activePrompt, modelName, options);
        } else {
            throw new Error(`Unknown provider: ${provider}`);
        }
    } catch (error) {
        console.error('Delegation failed:', error.message);
        return { success: false, error: error.message };
    }
}

// Delegate with Consensus - Query 2 AIs in parallel, then synthesize best ideas
async function delegateWithConsensus(prompt, options = {}) {
    console.log('\n🧠 CONSENSUS MODE: Querying 2 AIs in parallel...\n');

    const models = [
        { name: 'gemini', alias: 'gemini:pro' },
        { name: 'claude', alias: 'claude:sonnet' }
    ];

    // Stage 1: Run both AIs in parallel
    const startTime = Date.now();
    const results = await Promise.allSettled(
        models.map(async (m) => {
            try {
                const result = await delegate(prompt, { ...options, model: m.alias, silent: true, noParse: true });
                return { model: m.name, ...result };
            } catch (error) {
                return { model: m.name, success: false, error: error.message };
            }
        })
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`⏱️ Stage 1 complete: Both AIs responded in ${duration}s\n`);

    // Collect successful responses
    const successfulResults = results
        .filter(r => r.status === 'fulfilled' && r.value.success)
        .map(r => r.value);

    if (successfulResults.length === 0) {
        console.error('❌ Both AIs failed');
        return { success: false, error: 'Both AIs failed' };
    }

    // Display both responses
    console.log('═'.repeat(60));
    console.log('📊 RAW RESPONSES:');
    console.log('═'.repeat(60));
    for (const result of successfulResults) {
        console.log(`\n🤖 ${result.model.toUpperCase()}:`);
        console.log('─'.repeat(40));
        const output = result.output?.slice(0, 1500) || '[No output]';
        console.log(output);
        if (result.output?.length > 1500) console.log('...[truncated]');
    }

    // Stage 2: If we have 2 responses, synthesize them
    if (successfulResults.length >= 2) {
        console.log('\n' + '═'.repeat(60));
        console.log('🔄 Stage 2: Synthesizing best ideas from both AIs...');
        console.log('═'.repeat(60));

        const synthesisPrompt = `Tu es un expert en synthèse. Voici les réponses de 2 IAs à la même question.

QUESTION ORIGINALE:
${prompt}

RÉPONSE GEMINI:
${successfulResults.find(r => r.model === 'gemini')?.output?.slice(0, 3000) || 'N/A'}

RÉPONSE CLAUDE:
${successfulResults.find(r => r.model === 'claude')?.output?.slice(0, 3000) || 'N/A'}

MISSION:
1. Identifie les MEILLEURES IDÉES de chaque réponse
2. Combine-les en UNE réponse cohérente
3. Si les réponses se contredisent, explique les deux points de vue
4. Sois concis mais complet

SYNTHÈSE:`;

        try {
            const synthesisResult = await delegate(synthesisPrompt, {
                model: 'gemini:pro',
                noParse: true,
                silent: false
            });

            if (synthesisResult.success) {
                console.log('\n✅ SYNTHESIS COMPLETE');
                return {
                    success: true,
                    output: synthesisResult.output,
                    sources: successfulResults.map(r => r.model),
                    synthesized: true
                };
            }
        } catch (error) {
            console.warn('⚠️ Synthesis failed, returning first response');
        }
    }

    // Fallback: return first successful result
    console.log(`\n✅ Consensus complete - ${successfulResults.length} AI(s) consulted`);
    return successfulResults[0];
}

// List available models
async function listModels() {
    const registry = await loadModelRegistry();

    console.log('\n📋 Available Models:\n');

    console.log('Gemini:');
    Object.entries(registry.gemini).forEach(([key, model]) => {
        console.log(`  gemini:${key.padEnd(10)} → ${model.name}`);
        console.log(`    ${model.description}`);
    });

    console.log('\nOpenAI:');
    Object.entries(registry.openai).forEach(([key, model]) => {
        console.log(`  openai:${key.padEnd(10)} → ${model.name}`);
        console.log(`    ${model.description}`);
    });

    if (registry.claude) {
        console.log('\nClaude:');
        Object.entries(registry.claude).forEach(([key, model]) => {
            console.log(`  claude:${key.padEnd(10)} → ${model.name}`);
            console.log(`    ${model.description}`);
        });
    }

    console.log('\nAliases:');
    Object.entries(registry.aliases).forEach(([alias, target]) => {
        console.log(`  ${alias.padEnd(10)} → ${target}`);
    });

    console.log('\n');
}

// CLI Interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('--help')) {
        console.log(`
🚀 JARVIS MASTERSCRIPT - Model Registry Orchestration

Usage:
  masterscript <prompt> [options]
  masterscript --list-models

Options:
  --model <alias>      Model alias (e.g., gemini:flash, openai:codex, claude:sonnet)
  --task-type <type>   Task type for auto model selection
  --consensus          🧠 Query 2 AIs in parallel (gemini + claude) for best answer
  --swarm              🐝 Break task into parallel sub-tasks (Swarm Mode)
  --no-parse           Disable intent parsing and context enrichment
  --silent             Suppress CLI output
  --list-models        Show available models
  --help               Show this help

Examples:
  masterscript "fix lint errors"                        # Uses default (gemini:flash)
  masterscript "research crypto" --swarm                # Launch parallel research agents
  masterscript "architecture question" --consensus      # Query 2 AIs for consensus
  masterscript "write tests" --model openai:codex       # Specific model
  masterscript "debug issue" --model claude:opus        # Use Claude Opus

Model Aliases:
  fast       → gemini:pro
  smart      → gemini:pro
  advanced   → claude:sonnet
  genius     → claude:opus
        `);
        process.exit(0);
    }

    if (args.includes('--list-models')) {
        await listModels();
        process.exit(0);
    }

    const options = {
        model: args.includes('--model') ? args[args.indexOf('--model') + 1] : null,
        taskType: args.includes('--task-type') ? args[args.indexOf('--task-type') + 1] : null,
        consensus: args.includes('--consensus'),
        swarm: args.includes('--swarm'),
        noParse: args.includes('--no-parse'),
        silent: args.includes('--silent')
    };

    const prompt = args.filter(arg =>
        !arg.startsWith('--') &&
        arg !== options.model &&
        arg !== options.taskType
    ).join(' ');

    // Determine delegate function
    let delegateFunc = delegate;
    if (options.consensus) delegateFunc = delegateWithConsensus;
    if (options.swarm) delegateFunc = delegateSwarm;

    delegateFunc(prompt, options)
        .then(result => {
            if (result.success) {
                process.exit(0);
            } else {
                console.error(result.error);
                process.exit(1);
            }
        })
        .catch(err => {
            console.error('Fatal error:', err);
            process.exit(1);
        });
}

// Delegate Swarm - Break task into parallel sub-tasks
async function delegateSwarm(prompt, options = {}) {
    console.clear();
    console.log(`\n🐝 SWARM MODE: Decomposing task...\n`);

    // 1. Decompose Task
    const swarmPlanPrompt = `You are a Swarm Orchestrator. Break this task into 3-5 distinct, parallel sub-tasks to be executed by specialized agents.
    
TASK: "${prompt}"

OUTPUT JSON ONLY:
{
  "strategy": "Brief explanation of the parallel approach",
  "agents": [
    { "role": "Agent Name (e.g. SEO-Researcher)", "goal": "Specific sub-task instruction" }
  ]
}`;

    let plan;
    try {
        const planJson = await executeViaGeminiDirect(swarmPlanPrompt, 'gemini-3-flash-preview');
        const jsonMatch = planJson.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            plan = JSON.parse(jsonMatch[0]);
        } else {
            throw new Error('Invalid JSON from Swarm Planner');
        }
    } catch (e) {
        console.error('❌ Swarm planning failed:', e.message);
        return { success: false, error: e.message };
    }

    console.log(`📋 Strategy: ${plan.strategy}\n`);

    // 2. Launch Parallel Agents
    const agents = plan.agents;
    const statusMap = new Map(); // agentIndex -> status string
    const results = new Array(agents.length);

    // Render Loop
    const renderInterval = setInterval(() => {
        // Move cursor up N lines
        process.stdout.write(`\x1b[${agents.length + 3}A`);

        console.log(`╔════════════════════ SWARM STATUS ════════════════════╗`);
        agents.forEach((agent, i) => {
            const status = statusMap.get(i) || '⏳ Pending...';
            const icon = status.includes('Done') ? '✅' : status.includes('Running') ? '🔄' : '⏳';
            // Pad or truncate agent role
            const role = agent.role.padEnd(20).slice(0, 20);
            // Pad status
            const statusText = status.padEnd(30).slice(0, 30);
            console.log(`║ ${icon} ${role} │ ${statusText} ║`);
        });
        console.log(`╚══════════════════════════════════════════════════════╝`);
    }, 200);

    // Execute Agents
    const startTime = Date.now();

    await Promise.all(agents.map(async (agent, i) => {
        statusMap.set(i, '🚀 Starting...');

        try {
            statusMap.set(i, '🔄 Running...');

            // Spawn child masterscript
            const child = spawn(process.execPath, [
                process.argv[1],
                agent.goal,
                '--model', 'gemini:pro',
                '--no-parse',
                '--silent'
            ], { stdio: 'pipe' });

            let output = '';

            child.stdout.on('data', d => output += d.toString());

            await new Promise((resolve) => {
                child.on('close', resolve);
            });

            results[i] = {
                role: agent.role,
                output: output.trim(),
                success: true
            };
            statusMap.set(i, '✅ Done');

        } catch (e) {
            results[i] = {
                role: agent.role,
                error: e.message,
                success: false
            };
            statusMap.set(i, '❌ Failed');
        }
    }));

    clearInterval(renderInterval);
    console.log('\n\n✨ All agents returned.');

    // 3. Aggregate Results
    console.log(`\n🧩 Aggregating ${agents.length} results...\n`);

    const aggregationPrompt = `You are the Swarm Lead. Synthesize the results from these parallel agents into a final report.

ORIGINAL GOAL: "${prompt}"

AGENT RESULTS:
${results.map(r => `--- AGENT: ${r.role} ---\n${r.output?.slice(0, 2000) || r.error}\n`).join('\n')}

OUTPUT:
Create a comprehensive, cohesive final response that addresses the original goal using the data above.`;

    return await delegate(aggregationPrompt, {
        model: options.model || 'claude:opus',  // Use Opus for best synthesis
        noParse: true
    });
}

export { delegate, delegateWithConsensus, delegateSwarm, listModels, resolveModel };

