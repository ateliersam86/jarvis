// web/app/api/tasks/[taskId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ taskId: string }> }
) {
    try {
        const { taskId } = await params;

        // Dynamic project discovery - Note: on Docker, cwd is /app/web, .memory is at /app/.memory
        const memoryBaseDir = path.join(process.cwd(), '..', '.memory', 'projects');
        let projects: string[] = [];
        try {
            const entries = await fs.readdir(memoryBaseDir, { withFileTypes: true });
            projects = entries.filter(e => e.isDirectory()).map(e => e.name);
        } catch {
            console.error('Failed to read projects directory');
            // Fallback to known projects if directory read fails
            projects = ['jarvis', 'atelier-sam', 'atelier-web', 'photographie', 'atelier-web-travels', 'atelier-web-aventures'];
        }

        const agents = ['gemini', 'claude', 'chatgpt'];

        for (const projectId of projects) {
            for (const agentId of agents) {
                try {
                    const memoryPath = path.join(process.cwd(), '..', '.memory', 'projects', projectId, `${agentId}.json`);
                    const data = await fs.readFile(memoryPath, 'utf-8');
                    const memory = JSON.parse(data);

                    const task = memory.recentTasks?.find((t: { taskId: string }) => t.taskId === taskId);

                    if (task) {
                        return NextResponse.json({
                            task,
                            projectId,
                            agentId,
                            agent: {
                                workerId: memory.workerId,
                                modelId: memory.modelId,
                                totalTasks: memory.totalTasks,
                                successRate: memory.successRate
                            }
                        });
                    }
                } catch {
                    // Skip if file doesn't exist
                    continue;
                }
            }
        }

        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    } catch {
        return NextResponse.json({ error: 'Failed to load task' }, { status: 500 });
    }
}
