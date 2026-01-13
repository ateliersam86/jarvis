// web/app/api/tasks/brain/route.ts
// Reads the task.md from the current Antigravity brain session
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

interface Task {
    id: string;
    content: string;
    completed: boolean;
    inProgress: boolean;
    depth: number;
    phase?: string;
    agent?: string;
    complexity?: string;
    model?: string;
}

// Parse markdown checklist to structured tasks
function parseTaskMd(content: string): Task[] {
    const lines = content.split('\n');
    const tasks: Task[] = [];
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

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // Priority 1: Read from synced .memory/tasks/current.md (works on Docker)
        const syncedPath = path.join(process.cwd(), '..', '.memory', 'tasks', 'current.md');

        // Priority 2: Try local brain directory (for local dev)
        const brainDir = path.join(process.env.HOME || '/root', '.gemini/antigravity/brain');

        let taskPath: string | null = null;
        let content: string | null = null;

        // Try synced path first
        try {
            content = await fs.readFile(syncedPath, 'utf-8');
            taskPath = syncedPath;
        } catch {
            // Try to find brain directory
            try {
                const dirs = await fs.readdir(brainDir, { withFileTypes: true });
                const conversations = dirs.filter(d => d.isDirectory()).map(d => d.name);

                // Find most recent task.md
                let latestTask: { path: string; mtime: Date } | null = null;
                for (const convId of conversations) {
                    const potential = path.join(brainDir, convId, 'task.md');
                    try {
                        const stat = await fs.stat(potential);
                        if (!latestTask || stat.mtime > latestTask.mtime) {
                            latestTask = { path: potential, mtime: stat.mtime };
                        }
                    } catch { /* file doesn't exist */ }
                }

                if (latestTask) {
                    taskPath = latestTask.path;
                    content = await fs.readFile(taskPath, 'utf-8');
                }
            } catch { /* brain dir not found */ }
        }

        if (!content || !taskPath) {
            return NextResponse.json({
                tasks: [],
                message: 'No task.md found. Run: cp ~/.gemini/antigravity/brain/*/task.md .memory/tasks/current.md'
            });
        }

        // Parse already-loaded content
        const allTasks = parseTaskMd(content);

        // Filter options
        const filter = searchParams.get('filter') || 'active'; // active | all | completed

        let filteredTasks = allTasks;
        if (filter === 'active') {
            filteredTasks = allTasks.filter(t => !t.completed);
        } else if (filter === 'completed') {
            filteredTasks = allTasks.filter(t => t.completed);
        }

        // Stats
        const stats = {
            total: allTasks.length,
            completed: allTasks.filter(t => t.completed).length,
            inProgress: allTasks.filter(t => t.inProgress).length,
            pending: allTasks.filter(t => !t.completed && !t.inProgress).length
        };

        return NextResponse.json({
            tasks: filteredTasks,
            stats,
            source: taskPath,
            lastModified: (await fs.stat(taskPath)).mtime.toISOString()
        });

    } catch (error) {
        console.error('Error reading brain task.md:', error);
        return NextResponse.json({
            tasks: [],
            error: 'Failed to read task.md',
            message: String(error)
        }, { status: 500 });
    }
}
