#!/usr/bin/env node

/**
 * JARVIS PARALLEL AGENTS - Execute multiple agents simultaneously
 * 
 * Usage:
 *   node scripts/parallel-agents.mjs <task1> <task2> <task3> ...
 * 
 * Example:
 *   node scripts/parallel-agents.mjs \
 *     "translate page1.tsx" \
 *     "translate page2.tsx" \
 *     "translate page3.tsx"
 */

import { spawn } from 'child_process';
import path from 'path';

const tasks = process.argv.slice(2);

if (tasks.length === 0) {
    console.log(`
🤖 JARVIS PARALLEL AGENTS

Usage:
  parallel-agents <task1> <task2> <task3> ...

Example:
  parallel-agents "translate page1" "translate page2" "translate page3"
  
This will spawn ${tasks.length || 'N'} terminals, one for each task.
    `);
    process.exit(0);
}

console.log(`\n🚀 Launching ${tasks.length} parallel agents...\n`);

const agents = tasks.map((task, index) => {
    console.log(`Agent ${index + 1}: "${task}"`);

    // Spawn in new terminal with visible output
    const agent = spawn('npm', ['run', 'delegate', task], {
        cwd: process.cwd(),
        stdio: 'inherit', // Show output in real-time
        shell: true
    });

    agent.on('close', (code) => {
        console.log(`\n✅ Agent ${index + 1} completed with code ${code}`);
    });

    agent.on('error', (error) => {
        console.error(`\n❌ Agent ${index + 1} error:`, error.message);
    });

    return agent;
});

console.log(`\n📊 ${agents.length} agents running in parallel...\n`);

// Wait for all agents to complete
Promise.all(agents.map(agent => new Promise(resolve => {
    agent.on('close', resolve);
}))).then(() => {
    console.log('\n🎉 All agents completed!\n');
});
