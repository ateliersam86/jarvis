import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { saveGlobalConfig, loadGlobalConfig } from '../core/config.js';
import { verifyAuth } from '../core/api.js';

export default async function login(): Promise<void> {
    const config = await loadGlobalConfig();

    if (config.apiKey) {
        const { overwrite } = await inquirer.prompt([{
            type: 'confirm',
            name: 'overwrite',
            message: 'Already authenticated. Overwrite existing credentials?',
            default: false
        }]);

        if (!overwrite) {
            console.log(chalk.yellow('Login cancelled.'));
            return;
        }
    }

    console.log(chalk.cyan(`
  ╔══════════════════════════════════════════════════╗
  ║  🔐 Jarvis Authentication                        ║
  ║                                                  ║
  ║  Get your API key at:                            ║
  ║  ${chalk.underline('https://jarvis.atelier-sam.fr/settings/api-keys')}  ║
  ╚══════════════════════════════════════════════════╝
  `));

    const { apiKey } = await inquirer.prompt([{
        type: 'password',
        name: 'apiKey',
        message: 'Enter your Jarvis API Key:',
        mask: '*',
        validate: (input: string) => input.startsWith('jrv_') ? true : 'API key should start with jrv_'
    }]);

    const spinner = ora('Verifying credentials...').start();

    // Save temporarily to test
    await saveGlobalConfig({ apiKey });

    const result = await verifyAuth();

    if (result.valid) {
        await saveGlobalConfig({ apiKey, userId: result.user?.id });
        spinner.succeed(chalk.green(`Authenticated as ${result.user?.name || 'User'}`));
        console.log(chalk.dim(`\nConfig saved to ~/.jarvisrc`));
    } else {
        // Rollback
        await saveGlobalConfig({ apiKey: undefined });
        spinner.fail(chalk.red('Invalid API key'));
        process.exit(1);
    }
}
