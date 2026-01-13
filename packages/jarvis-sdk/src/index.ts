#!/usr/bin/env node
import { program } from 'commander';
import chalk from 'chalk';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

program
    .name('jarvis')
    .description('🤖 Jarvis SDK - AI Orchestration CLI')
    .version(pkg.version);

program
    .command('login')
    .description('Authenticate with Jarvis server')
    .action(async () => {
        const { default: login } = await import('./commands/login.js');
        await login();
    });

program
    .command('init')
    .description('Initialize Jarvis in current project')
    .action(async () => {
        const { default: init } = await import('./commands/init.js');
        await init();
    });

program
    .command('setup')
    .description('Setup underlying AI tools and verify environment')
    .action(async () => {
        const { default: setup } = await import('./commands/setup.js');
        await setup();
    });

program
    .command('delegate <prompt>')
    .description('Delegate a task to AI agents')
    .option('-m, --model <model>', 'Model to use (gemini, claude, chatgpt)', 'auto')
    .option('--swarm', 'Use swarm mode with multiple agents')
    .option('--consensus', 'Use consensus mode for validation')
    .action(async (prompt, options) => {
        const { default: delegate } = await import('./commands/delegate.js');
        await delegate(prompt, options);
    });

program
    .command('sync')
    .description('Sync project context with Jarvis server')
    .option('--push', 'Push local context to server')
    .option('--pull', 'Pull server context to local')
    .action(async (options) => {
        const { default: sync } = await import('./commands/sync.js');
        await sync(options);
    });

program
    .command('status')
    .description('Show current task status')
    .action(async () => {
        const { default: status } = await import('./commands/status.js');
        await status();
    });

// Parse arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
    console.log(chalk.cyan(`
    ╔══════════════════════════════════════╗
    ║  🤖 Jarvis SDK v${pkg.version.padEnd(20)}║
    ║  AI Orchestration at your fingertips ║
    ╚══════════════════════════════════════╝
  `));
    program.outputHelp();
}
export * from './core/plugin.js';
