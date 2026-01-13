import chalk from 'chalk';
import ora from 'ora';
import { io } from 'socket.io-client';
import { loadGlobalConfig, loadProjectConfig, isAuthenticated } from '../core/config.js';
import { createTask } from '../core/api.js';

interface DelegateOptions {
    model?: string;
    swarm?: boolean;
    consensus?: boolean;
}

export default async function delegate(prompt: string, options: DelegateOptions): Promise<void> {
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

    console.log(chalk.cyan(`
  ╔══════════════════════════════════════════════════╗
  ║  🤖 Jarvis Task Delegation                       ║
  ╚══════════════════════════════════════════════════╝
  `));

    console.log(chalk.dim(`Project: ${project.name}`));
    console.log(chalk.dim(`Mode: ${options.swarm ? 'Swarm' : options.consensus ? 'Consensus' : 'Single Agent'}`));
    console.log(chalk.dim(`Model: ${options.model || 'auto'}\n`));

    const spinner = ora('Connecting to Jarvis...').start();

    try {
        // Create task on server
        const mode = options.swarm ? 'swarm' : options.consensus ? 'consensus' : 'single';
        const { taskId, wsChannel } = await createTask(prompt, { mode, model: options.model });

        spinner.text = 'Task created, connecting to live stream...';

        // Connect to WebSocket for live logs
        const socket = io(config.serverUrl, {
            auth: { token: config.apiKey },
            transports: ['websocket']
        });

        socket.on('connect', () => {
            spinner.succeed(chalk.green('Connected to Jarvis'));
            socket.emit('subscribe', { channel: wsChannel });
        });

        socket.on('log', (data: { agent: string; content: string }) => {
            const agentColor = data.agent === 'gemini' ? chalk.blue
                : data.agent === 'claude' ? chalk.magenta
                    : chalk.green;
            console.log(`${agentColor(`[${data.agent}]`)} ${data.content}`);
        });

        socket.on('complete', (data: { result: string }) => {
            console.log(chalk.green('\n✅ Task completed!'));
            console.log(chalk.dim(data.result));
            socket.disconnect();
            process.exit(0);
        });

        socket.on('error', (err: Error) => {
            console.log(chalk.red(`\n❌ Error: ${err.message}`));
            socket.disconnect();
            process.exit(1);
        });

        socket.on('disconnect', () => {
            spinner.info('Disconnected from Jarvis');
        });

    } catch (error) {
        spinner.fail(chalk.red('Failed to create task'));
        console.error(error);
        process.exit(1);
    }
}
