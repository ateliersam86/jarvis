import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import { loadProjectConfig, loadGlobalConfig, isAuthenticated } from '../core/config.js';
import { syncMemory } from '../core/api.js';

interface SyncOptions {
    push?: boolean;
    pull?: boolean;
}

async function gatherProjectContext(): Promise<object> {
    const context: Record<string, unknown> = {};
    const cwd = process.cwd();

    // Package.json
    try {
        context.packageJson = JSON.parse(await fs.readFile(path.join(cwd, 'package.json'), 'utf-8'));
    } catch { /* skip */ }

    // README
    try {
        context.readme = await fs.readFile(path.join(cwd, 'README.md'), 'utf-8');
    } catch { /* skip */ }

    // tsconfig
    try {
        context.tsconfig = JSON.parse(await fs.readFile(path.join(cwd, 'tsconfig.json'), 'utf-8'));
    } catch { /* skip */ }

    // Directory structure (top 2 levels)
    async function getStructure(dir: string, depth = 0): Promise<string[]> {
        if (depth > 2) return [];
        const items = await fs.readdir(dir, { withFileTypes: true });
        const result: string[] = [];

        for (const item of items) {
            if (item.name.startsWith('.') || item.name === 'node_modules') continue;
            const fullPath = path.join(dir, item.name);
            const relativePath = path.relative(cwd, fullPath);

            if (item.isDirectory()) {
                result.push(`${relativePath}/`);
                result.push(...await getStructure(fullPath, depth + 1));
            } else {
                result.push(relativePath);
            }
        }
        return result;
    }

    context.structure = await getStructure(cwd);
    context.syncedAt = new Date().toISOString();

    return context;
}

export default async function sync(options: SyncOptions): Promise<void> {
    const config = await loadGlobalConfig();
    const project = await loadProjectConfig();

    if (!isAuthenticated(config)) {
        console.log(chalk.red('❌ Not authenticated. Run `jarvis login` first.'));
        process.exit(1);
    }

    if (!project) {
        console.log(chalk.red('❌ Project not initialized. Run `jarvis init` first.'));
        process.exit(1);
    }

    const spinner = ora('Gathering project context...').start();

    try {
        const context = await gatherProjectContext();

        spinner.text = 'Syncing with Jarvis server...';
        await syncMemory(project.projectId, context);

        spinner.succeed(chalk.green('Project context synced!'));

        const structure = (context as { structure?: string[] }).structure || [];
        console.log(chalk.dim(`\n  Files indexed: ${structure.length}`));
        console.log(chalk.dim(`  Project: ${project.name}`));
        console.log(chalk.dim(`  Server: ${config.serverUrl}`));

    } catch (error) {
        spinner.fail(chalk.red('Sync failed'));

        // Save locally as fallback
        const localPath = path.join(process.cwd(), '.jarvis', 'memory', 'context.json');
        const context = await gatherProjectContext();
        await fs.writeFile(localPath, JSON.stringify(context, null, 2));

        console.log(chalk.yellow('  Saved locally to .jarvis/memory/context.json'));
    }
}
