#!/usr/bin/env node

/**
 * JARVIS CLI SETUP - Auto-installer for AI CLI tools
 * 
 * Detects environment and installs/configures:
 * - Gemini CLI (Google)
 * - Claude CLI (Anthropic) - if available
 * - Codex CLI (OpenAI)
 * 
 * Works on: macOS, Linux, Windows (WSL recommended)
 */

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

const execAsync = promisify(exec);

// Fun loading messages (style Samuel)
const LOADING_MESSAGES = [
    "🧠 Initialisation des synapses numériques...",
    "⚡ Calibration des flux de conscience artificielle...",
    "🔮 Invocation des esprits du code...",
    "🌀 Synchronisation avec la matrice...",
    "🎯 Alignement des chakras binaires...",
    "🚀 Préchauffage des réacteurs à idées...",
    "🔬 Analyse spectrale de votre environnement...",
    "🎭 Préparation du théâtre d'opérations...",
];

const randomMessage = () => LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];

interface CLIConfig {
    name: string;
    command: string;
    checkCmd: string;
    installCmd: {
        darwin: string;
        linux: string;
        win32: string;
        [key: string]: string;
    };
    authCheck: () => Promise<boolean>;
    quotaCheck: () => Promise<{ available: boolean; tier: string; remaining: number }>;
}

/**
 * CLI Detection & Installation Registry
 */
const CLI_REGISTRY: Record<string, CLIConfig> = {
    gemini: {
        name: 'Gemini CLI',
        command: 'gemini',
        checkCmd: 'gemini --version',
        installCmd: {
            darwin: 'npm install -g @anthropic/gemini-cli || echo "Gemini CLI requires manual installation from Google"',
            linux: 'npm install -g @anthropic/gemini-cli || echo "Gemini CLI requires manual installation from Google"',
            win32: 'npm install -g @anthropic/gemini-cli',
        },
        authCheck: async () => {
            try {
                // Check for Google Cloud credentials or Gemini API key
                const hasGcloud = await execAsync('gcloud auth print-access-token').then(() => true).catch(() => false);
                const hasApiKey = !!process.env.GEMINI_API_KEY;
                return hasGcloud || hasApiKey;
            } catch {
                return false;
            }
        },
        quotaCheck: async () => {
            // TODO: Implement quota checking via Google Cloud API
            return { available: true, tier: 'unknown', remaining: -1 };
        }
    },

    claude: {
        name: 'Claude CLI',
        command: 'claude',
        checkCmd: 'claude --version',
        installCmd: {
            darwin: 'npm install -g @anthropic-ai/claude-code',
            linux: 'npm install -g @anthropic-ai/claude-code',
            win32: 'npm install -g @anthropic-ai/claude-code',
        },
        authCheck: async () => {
            const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
            // Check for Claude CLI auth file
            const authFile = path.join(os.homedir(), '.claude', 'credentials.json');
            const hasAuthFile = await fs.access(authFile).then(() => true).catch(() => false);
            return hasApiKey || hasAuthFile;
        },
        quotaCheck: async () => {
            // Claude has usage-based pricing, check via API
            return { available: true, tier: 'api', remaining: -1 };
        }
    },

    codex: {
        name: 'Codex CLI (OpenAI)',
        command: 'codex',
        checkCmd: 'codex --help',
        installCmd: {
            darwin: 'npm install -g @openai/codex',
            linux: 'npm install -g @openai/codex',
            win32: 'npm install -g @openai/codex',
        },
        authCheck: async () => {
            return !!process.env.OPENAI_API_KEY;
        },
        quotaCheck: async () => {
            return { available: true, tier: 'api', remaining: -1 };
        }
    }
};

/**
 * Detect current environment
 */
export async function detectEnvironment() {
    const platform = os.platform();
    const isAntigravity = !!process.env.ANTIGRAVITY_VERSION ||
        await fs.access('.gemini/antigravity').then(() => true).catch(() => false);
    const isVSCode = !!process.env.VSCODE_PID ||
        await fs.access('.vscode').then(() => true).catch(() => false);
    const isCursor = !!process.env.CURSOR_VERSION;

    return {
        platform,
        isAntigravity,
        isVSCode,
        isCursor,
        isTerminal: !isAntigravity && !isVSCode && !isCursor,
        home: os.homedir(),
        shell: process.env.SHELL || 'unknown',
    };
}

interface CLIStatus {
    installed: boolean;
    command: string;
    error?: string;
}

/**
 * Check if a CLI is installed
 */
export async function checkCLIInstalled(cliId: string): Promise<CLIStatus> {
    const cli = CLI_REGISTRY[cliId];
    if (!cli) return { installed: false, command: '', error: 'Unknown CLI' };

    try {
        await execAsync(cli.checkCmd);
        return { installed: true, command: cli.command };
    } catch {
        return { installed: false, command: cli.command };
    }
}

interface AllCLIsStatus {
    [key: string]: {
        name: string;
        installed: boolean;
        authenticated: boolean;
        quota: { available: boolean; tier: string; remaining: number } | null;
    };
}

/**
 * Check all CLI statuses
 */
export async function checkAllCLIs(): Promise<AllCLIsStatus> {
    console.log(chalk.cyan('\n' + randomMessage() + '\n'));

    const results: AllCLIsStatus = {};

    for (const [id, cli] of Object.entries(CLI_REGISTRY)) {
        const installed = await checkCLIInstalled(id);
        const authenticated = installed.installed ? await cli.authCheck() : false;
        const quota = installed.installed && authenticated ? await cli.quotaCheck() : null;

        results[id] = {
            name: cli.name,
            installed: installed.installed,
            authenticated,
            quota,
        };

        // Status emoji
        const statusEmoji = installed.installed
            ? (authenticated ? '✅' : '⚠️')
            : '❌';

        console.log(`${statusEmoji} ${cli.name}: ${installed.installed
                ? (authenticated ? chalk.green('Connecté') : chalk.yellow('Installé mais non authentifié'))
                : chalk.red('Non installé')
            }`);
    }

    return results;
}

/**
 * Install a specific CLI
 */
export async function installCLI(cliId: string): Promise<boolean> {
    const cli = CLI_REGISTRY[cliId];
    if (!cli) throw new Error(`Unknown CLI: ${cliId}`);

    const platform = os.platform();
    const installCmd = cli.installCmd[platform] || cli.installCmd.linux;

    console.log(chalk.cyan(`\n📦 Installation de ${cli.name}...`));
    console.log(chalk.dim(`   Commande: ${installCmd}\n`));

    try {
        const { stdout } = await execAsync(installCmd);
        if (stdout) console.log(stdout);

        // Verify installation
        const check = await checkCLIInstalled(cliId);
        if (check.installed) {
            console.log(chalk.green(`✅ ${cli.name} installé avec succès !`));
            return true;
        } else {
            console.log(chalk.yellow(`⚠️ Installation terminée mais ${cli.name} non détecté.`));
            return false;
        }
    } catch (error: any) {
        console.error(chalk.red(`❌ Échec de l'installation: ${error.message}`));
        return false;
    }
}

/**
 * Install all missing CLIs
 */
export async function installAllCLIs(): Promise<Record<string, boolean>> {
    console.log(chalk.bold.cyan('\n🔧 JARVIS CLI AUTO-INSTALLER\n'));
    console.log(chalk.dim('Installation des outils AI manquants...\n'));

    const results: Record<string, boolean> = {};

    for (const cliId of Object.keys(CLI_REGISTRY)) {
        const check = await checkCLIInstalled(cliId);
        if (!check.installed) {
            results[cliId] = await installCLI(cliId);
        } else {
            console.log(chalk.dim(`✓ ${CLI_REGISTRY[cliId].name} déjà installé`));
            results[cliId] = true;
        }
    }

    return results;
}

interface AgentDecision {
    agent: string | null;
    reason: string;
    priority: string[];
}

/**
 * Smart routing decision based on quotas and capabilities
 */
export function decideAgent(task: string, availableCLIs: AllCLIsStatus): AgentDecision {
    // Task type analysis
    const taskLower = task.toLowerCase();
    const isUI = /ui|interface|design|css|style|layout/i.test(taskLower);
    const isTest = /test|spec|jest|vitest|coverage/i.test(taskLower);
    const isArchitecture = /architect|design|plan|structure/i.test(taskLower);
    const isDebug = /debug|fix|error|bug/i.test(taskLower);
    const isRefactor = /refactor|clean|optimize/i.test(taskLower);
    const isDoc = /doc|readme|comment|explain/i.test(taskLower);

    // Agent capabilities (subjective but based on experience)
    // const AGENT_STRENGTHS = {
    //     claude: ['architecture', 'complex_reasoning', 'code_review', 'refactor'],
    //     gemini: ['fast_tasks', 'documentation', 'tests', 'ui'],
    //     codex: ['code_generation', 'api', 'integration', 'debug'],
    // };

    // Priority based on task type
    let priority = ['gemini', 'claude', 'codex']; // Default: use free tier first

    if (isArchitecture) {
        priority = ['claude', 'codex', 'gemini']; // Claude excels at architecture
    } else if (isDebug) {
        priority = ['codex', 'claude', 'gemini']; // Codex is great for debugging
    } else if (isUI || isTest || isDoc) {
        priority = ['gemini', 'codex', 'claude']; // Gemini is fast for these
    } else if (isRefactor) {
        priority = ['claude', 'gemini', 'codex']; // Claude for careful refactoring
    }

    // Find first available agent with quota
    for (const agentId of priority) {
        const agent = availableCLIs[agentId];
        if (agent?.installed && agent?.authenticated) {
            // Check quota if available
            if (agent.quota?.available !== false) {
                return {
                    agent: agentId,
                    reason: `Selected ${agentId} based on task type and availability`,
                    priority,
                };
            }
        }
    }

    // Fallback to any available
    for (const [id, agent] of Object.entries(availableCLIs)) {
        if (agent.installed && agent.authenticated) {
            return {
                agent: id,
                reason: `Fallback to ${id} (only available option)`,
                priority,
            };
        }
    }

    return {
        agent: null,
        reason: 'No AI agent available. Please install and authenticate at least one CLI.',
        priority,
    };
}

interface DelegateOptions {
    model?: string;
}

/**
 * Universal delegation function that works across environments
 */
export async function delegate(task: string, options: DelegateOptions = {}): Promise<{ success: boolean; agent: string }> {
    const cliStatus = await checkAllCLIs();
    const decision = decideAgent(task, cliStatus);

    if (!decision.agent) {
        throw new Error(decision.reason);
    }

    console.log(chalk.cyan(`\n🎯 Agent sélectionné: ${decision.agent.toUpperCase()}`));
    console.log(chalk.dim(`   Raison: ${decision.reason}\n`));

    // Execute based on agent
    const cli = CLI_REGISTRY[decision.agent];

    return new Promise((resolve, reject) => {
        const args = [task];
        if (options.model) args.push('--model', options.model);

        const child = spawn(cli.command, args, {
            stdio: 'inherit',
            shell: true,
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve({ success: true, agent: decision.agent! });
            } else {
                reject(new Error(`${cli.name} exited with code ${code}`));
            }
        });

        child.on('error', reject);
    });
}