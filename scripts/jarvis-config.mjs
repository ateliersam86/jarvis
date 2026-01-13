#!/usr/bin/env node

/**
 * JARVIS CONFIG - CLI Authentication & Configuration
 * 
 * Commands:
 *   jarvis-config login <token>  - Authenticate with jarvis server
 *   jarvis-config status         - Show connection status
 *   jarvis-config logout         - Remove authentication
 *   jarvis-config projects       - List projects
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.jarvis');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const JARVIS_API = process.env.JARVIS_API_URL || 'https://jarvis.atelier-sam.fr';

// Ensure config directory exists
async function ensureConfigDir() {
    try {
        await fs.mkdir(CONFIG_DIR, { recursive: true });
    } catch (err) {
        // Directory exists
    }
}

// Load config
async function loadConfig() {
    try {
        const data = await fs.readFile(CONFIG_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return {};
    }
}

// Save config
async function saveConfig(config) {
    await ensureConfigDir();
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// Login command
async function login(token) {
    if (!token) {
        console.error('❌ Token required. Usage: jarvis-config login <token>');
        process.exit(1);
    }

    console.log('🔐 Verifying token...');

    try {
        const response = await fetch(`${JARVIS_API}/api/v1/auth/verify`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!data.valid) {
            console.error(`❌ Invalid token: ${data.error || 'Unknown error'}`);
            process.exit(1);
        }

        // Save token
        const config = await loadConfig();
        config.token = token;
        config.user = data.user;
        config.loggedInAt = new Date().toISOString();
        await saveConfig(config);

        console.log(`✅ Logged in as ${data.user.name || data.user.email}`);
        console.log(`📊 Quota: ${data.quota?.remaining || 'unlimited'} remaining`);

    } catch (error) {
        console.error('❌ Failed to connect to Jarvis server:', error.message);
        process.exit(1);
    }
}

// Status command
async function status() {
    const config = await loadConfig();

    if (!config.token) {
        console.log('❌ Not logged in. Run: jarvis-config login <token>');
        process.exit(1);
    }

    console.log('🔍 Checking connection...');

    try {
        const response = await fetch(`${JARVIS_API}/api/v1/auth/verify`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!data.valid) {
            console.log('❌ Token expired or invalid. Run: jarvis-config login <token>');
            process.exit(1);
        }

        console.log(`\n🟢 Connected to Jarvis`);
        console.log(`👤 User: ${data.user.name || data.user.email}`);
        console.log(`📊 Quota: ${data.quota?.remaining || 'unlimited'} remaining`);
        console.log(`🔗 Server: ${JARVIS_API}`);
        console.log(`📅 Logged in: ${config.loggedInAt}`);

    } catch (error) {
        console.error('❌ Failed to connect:', error.message);
        process.exit(1);
    }
}

// Projects command
async function projects() {
    const config = await loadConfig();

    if (!config.token) {
        console.log('❌ Not logged in. Run: jarvis-config login <token>');
        process.exit(1);
    }

    try {
        const response = await fetch(`${JARVIS_API}/api/v1/projects`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${config.token}`
            }
        });

        const data = await response.json();

        if (data.error) {
            console.error(`❌ ${data.error}`);
            process.exit(1);
        }

        console.log('\n📁 Your Projects:\n');

        if (!data.projects || data.projects.length === 0) {
            console.log('  (No projects yet)');
        } else {
            data.projects.forEach(p => {
                console.log(`  ${p.color ? '●' : '○'} ${p.name}`);
                console.log(`    Slug: ${p.slug}`);
                console.log(`    Tasks: ${p.taskCount || 0}`);
                if (p.localPath) console.log(`    Path: ${p.localPath}`);
                console.log('');
            });
        }

    } catch (error) {
        console.error('❌ Failed to fetch projects:', error.message);
        process.exit(1);
    }
}

// Logout command
async function logout() {
    const config = await loadConfig();

    if (!config.token) {
        console.log('Already logged out.');
        return;
    }

    delete config.token;
    delete config.user;
    delete config.loggedInAt;
    await saveConfig(config);

    console.log('✅ Logged out');
}

// Detect project from current directory
async function detectProject() {
    const cwd = process.cwd();

    // Try to find package.json
    try {
        const pkgPath = path.join(cwd, 'package.json');
        const pkgData = await fs.readFile(pkgPath, 'utf-8');
        const pkg = JSON.parse(pkgData);
        return {
            name: pkg.name || path.basename(cwd),
            localPath: cwd,
            description: pkg.description || null,
        };
    } catch {
        // No package.json, use directory name
        return {
            name: path.basename(cwd),
            localPath: cwd,
            description: null,
        };
    }
}

// Parse task.md to extract tasks
async function parseTasks() {
    const cwd = process.cwd();
    const possiblePaths = [
        path.join(cwd, '.gemini', 'brain', 'task.md'),
        path.join(cwd, 'brain', 'task.md'),
        path.join(cwd, 'task.md'),
    ];

    for (const taskPath of possiblePaths) {
        try {
            const content = await fs.readFile(taskPath, 'utf-8');
            const tasks = [];
            const lines = content.split('\n');

            for (const line of lines) {
                // Match: - [ ] Task, - [x] Task, - [/] Task
                const match = line.match(/^-\s*\[([ x\/])\]\s*\*?\*?(.+?)\*?\*?\s*$/);
                if (match) {
                    const checked = match[1];
                    const title = match[2].replace(/\*\*/g, '').trim();
                    let status = 'PENDING';

                    if (checked === 'x') status = 'COMPLETED';
                    else if (checked === '/') status = 'IN_PROGRESS';

                    tasks.push({ title, status });
                }
            }

            return { tasks, path: taskPath };
        } catch {
            continue;
        }
    }

    return { tasks: [], path: null };
}

// Sync command - syncs current project to dashboard
async function sync() {
    const config = await loadConfig();

    if (!config.token) {
        console.log('❌ Not logged in. Run: jarvis-config login <token>');
        process.exit(1);
    }

    console.log('🔄 Syncing project to dashboard...\n');

    // Detect project
    const project = await detectProject();
    console.log(`📁 Project: ${project.name}`);
    console.log(`📍 Path: ${project.localPath}`);

    // Sync project
    try {
        const projResponse = await fetch(`${JARVIS_API}/api/v1/projects/sync`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(project)
        });

        const projData = await projResponse.json();

        if (projData.error) {
            console.error(`❌ Project sync failed: ${projData.error}`);
            process.exit(1);
        }

        console.log(`✅ Project ${projData.action}: ${projData.project.name}`);

        // Parse and sync tasks
        const { tasks, path: taskPath } = await parseTasks();

        if (tasks.length === 0) {
            console.log('\n📋 No tasks found (no task.md)');
        } else {
            console.log(`\n📋 Found ${tasks.length} tasks in ${taskPath}`);

            const taskResponse = await fetch(`${JARVIS_API}/api/v1/tasks/sync`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    projectId: projData.project.id,
                    tasks: tasks
                })
            });

            const taskData = await taskResponse.json();

            if (taskData.error) {
                console.error(`❌ Tasks sync failed: ${taskData.error}`);
            } else {
                console.log(`✅ Tasks synced: ${taskData.results.created} created, ${taskData.results.updated} updated`);
            }
        }

        console.log('\n🎉 Sync complete!');
        console.log(`🔗 View at: ${JARVIS_API}/dashboard`);

    } catch (error) {
        console.error('❌ Sync failed:', error.message);
        process.exit(1);
    }
}

// Init command - initialize project and sync
async function init() {
    console.log('🚀 Initializing Jarvis for this project...\n');
    await sync();
}

// CLI Entry
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
    case 'login':
        await login(args[1]);
        break;
    case 'status':
        await status();
        break;
    case 'projects':
        await projects();
        break;
    case 'logout':
        await logout();
        break;
    case 'sync':
        await sync();
        break;
    case 'init':
        await init();
        break;
    default:
        console.log(`
🤖 JARVIS CONFIG - CLI Authentication & Sync

Commands:
  login <token>   Authenticate with Jarvis server
  status          Show connection status
  projects        List your projects
  sync            Sync current project & tasks to dashboard
  init            Initialize project and sync
  logout          Remove authentication

Example:
  jarvis-config login jarvis_abc123...
  jarvis-config sync
  jarvis-config projects
    `);
}

