import chalk from 'chalk';
import { loadGlobalConfig, loadProjectConfig, isAuthenticated } from '../core/config.js';
import { getTaskStatus, verifyAuth } from '../core/api.js';

export default async function status(): Promise<void> {
    const config = await loadGlobalConfig();
    const project = await loadProjectConfig();

    console.log(chalk.cyan(`
  ╔══════════════════════════════════════════════════╗
  ║  📊 Jarvis Status                                ║
  ╚══════════════════════════════════════════════════╝
  `));

    // Auth status
    if (isAuthenticated(config)) {
        const auth = await verifyAuth();
        if (auth.valid) {
            console.log(chalk.green('  ✓ Authenticated'));
            console.log(chalk.dim(`    User: ${auth.user?.name || config.userId || 'Unknown'}`));
            
            if (auth.quota) {
                const percent = Math.round((auth.quota.used / auth.quota.limit) * 100);
                const color = percent > 90 ? chalk.red : percent > 75 ? chalk.yellow : chalk.green;
                console.log(chalk.dim(`    Quota: ${color(`${percent}%`)} (${auth.quota.used}/${auth.quota.limit})`));
            }
        } else {
            console.log(chalk.red('  ✗ Authentication Expired'));
            console.log(chalk.dim('    Run: jarvis login'));
        }
    } else {
        console.log(chalk.red('  ✗ Not authenticated'));
        console.log(chalk.dim('    Run: jarvis login'));
    }

    // Project status
    if (project) {
        console.log(chalk.green(`  ✓ Project initialized: ${project.name}`));
        console.log(chalk.dim(`    ID: ${project.projectId}`));
        console.log(chalk.dim(`    Type: ${project.type}`));
    } else {
        console.log(chalk.yellow('  ✗ No project initialized'));
        console.log(chalk.dim('    Run: jarvis init'));
    }

    // Server connection
    console.log(chalk.dim(`\n  Server: ${config.serverUrl}`));

    // TODO: Fetch active tasks from server
    console.log(chalk.dim('\n  Active Tasks: (coming soon)'));
}
