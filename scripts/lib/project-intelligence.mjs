// scripts/lib/project-intelligence.mjs
// Project Intelligence Module - Auto-context for Masterscript
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export const ProjectIntelligence = {
    // 1. Gather all context sources automatically
    async gatherContext() {
        try {
            const [projectMem, currentTask, gitState, healthState, recentFiles] = await Promise.all([
                this.readFileSafe('PROJECT_MEMORY.md'),
                this.readFileSafe('.memory/tasks/current.md'),
                this.getGitState(),
                this.getHealthState(),
                this.getRecentlyModifiedFiles()
            ]);

            return {
                projectSummary: this.extractSection(projectMem, 'Current State') || 'Active project',
                techStack: this.extractSection(projectMem, 'Tech Stack') || '',
                currentTask: this.extractActiveTask(currentTask) || null,
                modifiedFiles: gitState,
                recentFiles: recentFiles,
                health: healthState
            };
        } catch (error) {
            console.warn('⚠️ Project Intelligence: Failed to gather context', error.message);
            return {
                projectSummary: 'Unknown',
                techStack: '',
                currentTask: null,
                modifiedFiles: [],
                recentFiles: [],
                health: { typeErrors: 0, lintErrors: 0 }
            };
        }
    },

    // 2. Enrich prompt with project context
    enrichPrompt(userPrompt, context) {
        const contextBlock = [];

        // Add project state if available
        if (context.projectSummary) {
            contextBlock.push(`[PROJECT STATUS] ${context.projectSummary}`);
        }

        // Add current task if any
        if (context.currentTask) {
            contextBlock.push(`[ACTIVE TASK] ${context.currentTask}`);
        }

        // Add modified files
        if (context.modifiedFiles.length > 0) {
            contextBlock.push(`[MODIFIED FILES] ${context.modifiedFiles.join(', ')}`);
        }

        // Add health status
        if (context.health.typeErrors > 0 || context.health.lintErrors > 0) {
            contextBlock.push(`[HEALTH] ${context.health.typeErrors} type errors, ${context.health.lintErrors} lint errors`);
        }

        // If no user input, suggest continuing active task
        if (!userPrompt.trim() && context.currentTask) {
            return `Continue working on: ${context.currentTask}\n\n${contextBlock.join('\n')}`;
        }

        // Enrich normal prompt
        if (contextBlock.length === 0) {
            return userPrompt;
        }

        return `${contextBlock.join('\n')}\n\n[USER REQUEST]\n${userPrompt}`;
    },

    // 3. Update health state dynamically (for expertise counters)
    async updateHealthState(projectId = 'jarvis') {
        const statePath = path.join(process.cwd(), '.conductor', 'state.json');
        const memoryPath = path.join(process.cwd(), '.memory', 'projects', projectId);

        try {
            // Run TypeScript check
            let typeErrors = 0;
            try {
                const { stdout } = await execAsync('cd web && npx tsc --noEmit --pretty false 2>&1 || true', {
                    timeout: 30000
                });
                typeErrors = (stdout.match(/error TS/g) || []).length;
            } catch { /* ignore */ }

            // Run ESLint check
            let lintErrors = 0;
            try {
                const { stdout } = await execAsync('cd web && npx eslint . --format compact 2>&1 || true', {
                    timeout: 30000
                });
                lintErrors = (stdout.match(/\d+ problems?/g) || []).reduce((acc, m) => {
                    const num = parseInt(m);
                    return acc + (isNaN(num) ? 0 : num);
                }, 0);
            } catch { /* ignore */ }

            // Update conductor state
            await fs.mkdir(path.dirname(statePath), { recursive: true });
            const currentState = JSON.parse(await this.readFileSafe(statePath) || '{}');

            const newState = {
                ...currentState,
                lastCheck: new Date().toISOString(),
                metrics: {
                    typeErrors,
                    lintErrors
                }
            };

            await fs.writeFile(statePath, JSON.stringify(newState, null, 2));

            // Also update worker memory expertise counters
            const workerFiles = ['gemini.json', 'chatgpt.json', 'claude.json'];
            for (const file of workerFiles) {
                try {
                    const workerPath = path.join(memoryPath, file);
                    const workerData = JSON.parse(await this.readFileSafe(workerPath) || '{}');

                    if (workerData.expertise) {
                        workerData.expertise.lint = lintErrors;
                        workerData.expertise.typeErrors = typeErrors;
                        await fs.writeFile(workerPath, JSON.stringify(workerData, null, 4));
                    }
                } catch { /* ignore individual worker errors */ }
            }

            console.log(`🔍 Health Check: ${typeErrors} type errors, ${lintErrors} lint errors`);
            return { typeErrors, lintErrors };

        } catch (error) {
            console.warn('⚠️ Health check failed:', error.message);
            return { typeErrors: 0, lintErrors: 0 };
        }
    },

    // --- Helpers ---
    async getHealthState() {
        const state = JSON.parse(await this.readFileSafe('.conductor/state.json') || '{}');
        return state.metrics || { typeErrors: 0, lintErrors: 0 };
    },

    async getGitState() {
        try {
            const { stdout } = await execAsync('git diff --name-only HEAD 2>/dev/null || true');
            return stdout.split('\n').filter(Boolean).slice(0, 5);
        } catch { return []; }
    },

    async getRecentlyModifiedFiles() {
        try {
            const { stdout } = await execAsync('find web -name "*.tsx" -o -name "*.ts" -mmin -30 2>/dev/null | head -5 || true');
            return stdout.split('\n').filter(Boolean);
        } catch { return []; }
    },

    async readFileSafe(filepath) {
        try {
            return await fs.readFile(path.resolve(process.cwd(), filepath), 'utf-8');
        } catch {
            return '';
        }
    },

    extractSection(text, header) {
        const regex = new RegExp(`## ${header}[\\s\\S]*?(?=##|$)`, 'i');
        const match = text.match(regex);
        return match ? match[0].replace(`## ${header}`, '').trim().slice(0, 300) : null;
    },

    extractActiveTask(text) {
        // Find first unchecked task
        const match = text.match(/- \[ \] (.*)/);
        return match ? match[1].slice(0, 100) : null;
    }
};

export default ProjectIntelligence;
