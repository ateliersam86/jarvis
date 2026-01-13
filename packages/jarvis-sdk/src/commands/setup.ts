import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { loadGlobalConfig, isAuthenticated } from '../core/config.js';
import { verifyAuth } from '../core/api.js';
import { checkAllCLIs, installAllCLIs } from '../core/setup.js';

export default async function setup(): Promise<void> {
    console.log(chalk.cyan(`
  ╔══════════════════════════════════════════════════╗
  ║  🛠️  Jarvis Environment Setup                    ║
  ╚══════════════════════════════════════════════════╝
  `));

    // 1. Check Authentication with Jarvis Cloud
    console.log(chalk.blue('☁️  Checking Jarvis Cloud Connection...'));
    const config = await loadGlobalConfig();
    const isAuth = isAuthenticated(config);
    
    if (!isAuth) {
        console.log(chalk.yellow('⚠️  Not authenticated with Jarvis Cloud.'));
        const { login } = await inquirer.prompt([{
            type: 'confirm',
            name: 'login',
            message: 'Would you like to login now?',
            default: true
        }]);

        if (login) {
            const { default: loginCmd } = await import('./login.js');
            await loginCmd();
        }
    } else {
        // Verify token validity and get quota
        const spinner = ora('Verifying session...').start();
        const authResult = await verifyAuth();
        
        if (authResult.valid) {
            spinner.succeed(chalk.green(`Connected as ${authResult.user?.name}`));
            if (authResult.quota) {
                console.log(chalk.dim(`   Quota: ${authResult.quota.used} / ${authResult.quota.limit} tokens used`));
                const remaining = authResult.quota.remaining;
                const color = remaining < 100000 ? chalk.red : remaining < 500000 ? chalk.yellow : chalk.green;
                console.log(chalk.dim(`   Remaining: `) + color(`${remaining} tokens`));
            }
        } else {
            spinner.warn(chalk.yellow('Authentication token expired or invalid.'));
        }
    }

    // 2. Check Underlying CLIs using Core Logic
    console.log(chalk.blue('\n📦 Checking AI Toolchain...'));
    const cliStatus = await checkAllCLIs();

    // Check if any are missing or not authenticated
    const missing = Object.values(cliStatus).some(s => !s.installed);
    
    if (missing) {
        console.log('');
        const { install } = await inquirer.prompt([{
            type: 'confirm',
            name: 'install',
            message: 'Some tools are missing. Attempt auto-installation?',
            default: true
        }]);

        if (install) {
            await installAllCLIs();
        }
    } else {
        console.log(chalk.green('\n✨ All AI tools are installed!'));
    }

    console.log(chalk.dim('\nTip: You can use `jarvis delegate` to assign tasks.'));
}