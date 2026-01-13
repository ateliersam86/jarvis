import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import pty from 'node-pty';
import cors from 'cors';
import os from 'os';
import { URL } from 'url';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const app = express();
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = 4000;

// --- Task Watcher Logic ---

let taskPath = null;
const taskClients = new Set();
let currentTaskData = null;

// Parse markdown checklist to structured tasks (mirrors logic in route.ts)
function parseTaskMd(content) {
    const lines = content.split('\n');
    const tasks = [];
    let currentPhase = '';

    lines.forEach(line => {
        // Detect phase headers
        const phaseMatch = line.match(/^- \[.\] \*\*Phase \d+: (.+?)\*\*/);
        if (phaseMatch) {
            currentPhase = phaseMatch[1];
        }

        // Parse checkbox items
        const match = line.match(/^(\s*)- \[(x| |\/)\] (.+?)(?:\s*<!--.*-->)?$/);
        if (match) {
            const indent = match[1].length;
            const status = match[2];
            let rawContent = match[3].replace(/\*\*/g, '').replace(/<!--.*-->/g, '').trim();

            // Extract Metadata
            let agent = 'Auto';
            let complexity = 'Low';
            let model = '';

            // Parse (@Agent)
            const agentMatch = rawContent.match(/\(@(.+?)\)/);
            if (agentMatch) {
                agent = agentMatch[1];
                rawContent = rawContent.replace(agentMatch[0], '').trim();
            }

            // Parse [Complexity/Priority]
            const complexMatch = rawContent.match(/\[(.+?)\]/);
            if (complexMatch) {
                complexity = complexMatch[1];
                rawContent = rawContent.replace(complexMatch[0], '').trim();
            }

            // Parse {Model}
            const modelMatch = rawContent.match(/\{(.+?)\}/);
            if (modelMatch) {
                model = modelMatch[1];
                rawContent = rawContent.replace(modelMatch[0], '').trim();
            }

            tasks.push({
                id: crypto.createHash('md5').update(rawContent).digest('hex').substring(0, 8),
                content: rawContent,
                completed: status === 'x',
                inProgress: status === '/',
                depth: Math.floor(indent / 4),
                phase: currentPhase || undefined,
                agent,
                complexity,
                model
            });
        }
    });

    return tasks;
}

// Locate and read task file
async function updateTaskData() {
    try {
        if (!taskPath) return;
        const content = await fsPromises.readFile(taskPath, 'utf-8');
        const tasks = parseTaskMd(content);
        
        // Calculate stats
        const stats = {
            total: tasks.length,
            completed: tasks.filter(t => t.completed).length,
            inProgress: tasks.filter(t => t.inProgress).length,
            pending: tasks.filter(t => !t.completed && !t.inProgress).length
        };

        const payload = JSON.stringify({
            type: 'tasks-update',
            data: {
                tasks,
                stats,
                lastModified: new Date().toISOString()
            }
        });

        currentTaskData = payload; // Cache for new connections

        // Broadcast
        for (const client of taskClients) {
            if (client.readyState === 1) { // OPEN
                client.send(payload);
            }
        }
    } catch (err) {
        console.error('[Watcher] Error updating tasks:', err);
    }
}

async function initTaskWatcher() {
    // Priority 1: Synced path
    const syncedPath = path.join(process.cwd(), '..', '.memory', 'tasks', 'current.md');
    
    // Priority 2: Brain dir
    const brainDir = path.join(process.env.HOME || '/root', '.gemini/antigravity/brain');

    try {
        await fsPromises.access(syncedPath);
        taskPath = syncedPath;
    } catch {
        try {
            const dirs = await fsPromises.readdir(brainDir, { withFileTypes: true });
            const conversations = dirs.filter(d => d.isDirectory()).map(d => d.name);
            
            let latestTask = null;
            for (const convId of conversations) {
                const potential = path.join(brainDir, convId, 'task.md');
                try {
                    const stat = await fsPromises.stat(potential);
                    if (!latestTask || stat.mtime > latestTask.mtime) {
                        latestTask = { path: potential, mtime: stat.mtime };
                    }
                } catch {}
            }
            if (latestTask) taskPath = latestTask.path;
        } catch {}
    }

    if (taskPath) {
        console.log(`[Watcher] Watching task file: ${taskPath}`);
        // Initial read
        await updateTaskData();

        // Watch for changes
        let debounceTimer;
        fs.watch(taskPath, (eventType, filename) => {
            if (eventType === 'change') {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(updateTaskData, 100);
            }
        });
    } else {
        console.warn('[Watcher] No task.md found to watch.');
    }
}


console.log(`[PTY] Server starting on port ${PORT}...`);
initTaskWatcher();

wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const mode = url.searchParams.get('mode') || 'local';

    // --- MODE: WATCHER ---
    if (mode === 'watcher') {
        console.log('[Watcher] Client connected');
        taskClients.add(ws);
        
        // Send immediate data if available
        if (currentTaskData) {
            ws.send(currentTaskData);
        }

        ws.on('close', () => {
            taskClients.delete(ws);
            console.log('[Watcher] Client disconnected');
        });
        return;
    }

    // --- MODE: PTY ---
    console.log('[PTY] Client connected');

    // Default to local shell
    const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
    const container = url.searchParams.get('container') || '';

    let cmd = shell;
    let args = [];

    if (mode === 'docker' && container) {
        cmd = 'docker';
        args = ['exec', '-it', container, 'bash'];
    }

    console.log(`[PTY] Spawning: ${cmd} ${args.join(' ')}`);

    const ptyProcess = pty.spawn(cmd, args, {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: process.env.HOME,
        env: process.env
    });

    // Send PTY output to WS
    ptyProcess.onData((data) => {
        if (ws.readyState === 1) { // WebSocket.OPEN
            ws.send(data);
        }
    });

    // Receive WS input and write to PTY
    ws.on('message', (message) => {
        ptyProcess.write(message.toString());
    });

    // Handle Resize
    // Protocol: JSON message { type: 'resize', cols: 100, rows: 50 }
    // But basic text is sent as input. We might need a protocol.
    // For now, assume raw string is input. 
    // TODO: Implement resizing protocol.

    ws.on('close', () => {
        console.log('[PTY] Client disconnected, killing process');
        ptyProcess.kill();
    });
});


server.listen(PORT, '0.0.0.0', () => {
    console.log(`[PTY] WebSocket Server listening on port ${PORT}`);
});