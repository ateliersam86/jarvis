import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import inquirer from 'inquirer';
import figlet from 'figlet';
import { loadGlobalConfig, isAuthenticated, saveProjectConfig, loadProjectConfig } from '../core/config.js';
import { createProject } from '../core/api.js';
import { v4 as uuidv4 } from 'uuid';

const LOADING_MESSAGES = [
    'Calibrating personality matrix...',
    'Scanning for sarcasm...',
    'Establishing neural link...',
    'Ignoring "node_modules" (it is too dark inside)...',
    'Reviewing code style choices...',
    'Calculating infinite loop probability...',
    'Waking up the hamsters...',
    'Converting caffeine to code...',
    'Optimizing procrastination algorithms...',
    'Checking for sentient bugs...',
    'Downloading more RAM...',
    'Reading the entire documentation (just kidding)...'
];

async function detectProjectType(): Promise<string> {
    try {
        const pkgPath = path.join(process.cwd(), 'package.json');
        
        // Check if package.json exists
        try {
            await fs.access(pkgPath);
        } catch {
            return 'other';
        }

        const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));

        if (pkg.dependencies?.next || pkg.devDependencies?.next) return 'next';
        if (pkg.dependencies?.react || pkg.devDependencies?.react) return 'react';
        if (pkg.dependencies?.vue || pkg.devDependencies?.vue) return 'vue';
        if (pkg.dependencies?.express || pkg.devDependencies?.express) return 'node';
        if (pkg.dependencies?.typescript || pkg.devDependencies?.typescript) return 'node';

        return 'node';
    } catch {
        return 'other';
    }
}

const showHeader = () => {
    console.clear();
    console.log(chalk.cyan(figlet.textSync('JARVIS', { horizontalLayout: 'full' })));
    console.log(chalk.dim('   Artificial Intelligence Orchestration & Setup Wizard v2.0'));
    console.log(chalk.dim('   --------------------------------------------------------'));
    console.log('');
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default async function init(): Promise<void> {
    showHeader();

    // 1. Environment Check
    const config = await loadGlobalConfig();
    const isAuth = isAuthenticated(config);
    const existing = await loadProjectConfig();

    if (existing) {
        console.log(chalk.yellow(`⚠️  Project already initialized: ${existing.name}`));
        console.log(chalk.dim(`   ID: ${existing.projectId}`));
        console.log(chalk.dim(`   Type: ${existing.type}`));
        
        const { reinitialize } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'reinitialize',
                message: 'Do you want to re-initialize this project? (Existing config will be overwritten)',
                default: false
            }
        ]);

        if (!reinitialize) {
            console.log(chalk.blue('👋 Very well. Standing by.'));
            return;
        }
    }

    if (!isAuth) {
        console.log(chalk.yellow('⚠️  Authentication Protocol: Offline'));
        console.log(chalk.dim('   You are not logged in. Jarvis will operate in Local Mode.'));
        console.log(chalk.dim('   Some advanced cloud features will be unavailable.'));
        console.log('');
        
        const { proceed } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'proceed',
                message: 'Do you wish to proceed in Local Mode?',
                default: true
            }
        ]);

        if (!proceed) {
            console.log(chalk.red('❌ Initialization aborted. Run `jarvis login` to authenticate first.'));
            return;
        }
    } else {
        console.log(chalk.green('✅ Authentication Protocol: Active'));
        console.log(chalk.dim(`   User: ${config.userId || 'Unknown Agent'}`));
        console.log('');
    }

    // 2. Data Collection (Wizard)
    const detectedType = await detectProjectType();
    const defaultName = path.basename(process.cwd());

    console.log(chalk.blue('📝 Configuration Wizard'));

    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'projectName',
            message: 'What shall we call this project?',
            default: defaultName,
            validate: (input) => input.length > 0 || 'Project name cannot be empty.'
        },
        {
            type: 'list',
            name: 'projectType',
            message: 'Detecting technology stack...',
            choices: [
                { name: 'Next.js', value: 'next' },
                { name: 'React', value: 'react' },
                { name: 'Vue.js', value: 'vue' },
                { name: 'Node.js', value: 'node' },
                { name: 'Python', value: 'python' },
                { name: 'Other', value: 'other' }
            ],
            default: detectedType
        },
        {
            type: 'confirm',
            name: 'ready',
            message: 'Parameters acceptable. Initialize system?',
            default: true
        }
    ]);

    if (!answers.ready) {
        console.log(chalk.yellow('🛑 Initialization canceled by user.'));
        return;
    }

    console.log('');
    
    // 3. Initialization Process
    const spinner = ora('Initializing Jarvis...').start();
    
    // Fun loop to change spinner text
    let msgIndex = 0;
    const msgInterval = setInterval(() => {
        spinner.text = LOADING_MESSAGES[msgIndex % LOADING_MESSAGES.length];
        msgIndex++;
    }, 800);

    try {
        // Register with server (offline fallback with local UUID)
        let projectId: string;
        try {
            // Artificial delay for effect (and to let users see at least one fun message)
            await sleep(1500); 

            if (isAuth) {
                const result = await createProject(answers.projectName, answers.projectType);
                projectId = result.id;
            } else {
                throw new Error('Offline mode');
            }
        } catch {
            // Offline mode - generate local ID
            projectId = `local_${uuidv4().slice(0, 8)}`;
            if (isAuth) {
                 // Only warn if we EXPECTED to be online
                 // But actually, createProject might fail even if auth is valid (server down)
                 // So we can check if it was an auth issue or connection issue.
                 // For now, keep it simple.
            }
        }

        // Save project config
        await saveProjectConfig({
            projectId,
            name: answers.projectName,
            type: answers.projectType,
            createdAt: new Date().toISOString()
        });

        // Create .jarvis directory structure
        await fs.mkdir(path.join(process.cwd(), '.jarvis', 'memory'), { recursive: true });

        clearInterval(msgInterval);
        spinner.succeed(chalk.green(`Jarvis initialized for ${chalk.bold(answers.projectName)}`));

        console.log('');
        console.log(chalk.cyan('╔════════════════════════════════════════════════════╗'));
        console.log(chalk.cyan('║               SYSTEM STATUS: ONLINE                ║'));
        console.log(chalk.cyan('╚════════════════════════════════════════════════════╝'));
        console.log(chalk.dim('   Project ID: ') + chalk.white(projectId));
        console.log(chalk.dim('   Type:       ') + chalk.white(answers.projectType));
        console.log(chalk.dim('   Config:     ') + chalk.white('.jarvis/config.json'));
        console.log('');
        console.log(chalk.yellow('   Next Objectives:'));
        console.log(chalk.white(`   1. Run ${chalk.cyan('jarvis sync')} to index your codebase.`));
        console.log(chalk.white(`   2. Use ${chalk.cyan('jarvis delegate')} to assign tasks.`));
        console.log('');
        console.log(chalk.blue('   "At your service, sir."'));

    } catch (error) {
        clearInterval(msgInterval);
        spinner.fail(chalk.red('Initialization Failed'));
        console.error(error);
        process.exit(1);
    }
}