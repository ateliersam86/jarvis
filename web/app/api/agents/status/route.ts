import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';


interface RawTask {
    taskId: string;
    input: string;
    output: string;
    timestamp: string;
    filesModified?: string[];
    images?: string[];
    success?: boolean;
    model?: string;
    mode?: string;
}

export async function GET() {
    const memoryBaseDir = path.join(process.cwd(), '.memory', 'projects');

    try {
        // Dynamic project discovery from folder structure
        const projects = await fs.readdir(memoryBaseDir, { withFileTypes: true });
        
        const agentStatuses = await Promise.all(
            projects
                .filter(dirent => dirent.isDirectory())
                .map(async (dirent) => {
                    const projectId = dirent.name;
                    const projectDir = path.join(memoryBaseDir, projectId);

                    // Dynamic agent discovery (all .json files except conductor_state)
                    const files = await fs.readdir(projectDir, { withFileTypes: true });
                    const agentFiles = files.filter(f => 
                        f.isFile() && 
                        f.name.endsWith('.json') && 
                        f.name !== 'conductor_state.json'
                    );

                    const projectAgents = await Promise.all(
                        agentFiles.map(async (agentFile) => {
                            const agentId = agentFile.name.replace('.json', '');
                            const memoryPath = path.join(projectDir, agentFile.name);
                            try {
                                const data = await fs.readFile(memoryPath, 'utf-8');
                                const memory = JSON.parse(data);

                                // Determine if active (last task within 60 seconds for better visibility)
                                const tasks = memory.recentTasks || [];
                                const lastTask = tasks[0];
                                const lastTaskTime = lastTask ? new Date(lastTask.timestamp).getTime() : 0;
                                const isActive = (Date.now() - lastTaskTime) < 60000;

                                // Extract 5 last tasks with full details
                                const recentTasks = tasks.slice(0, 5).map((t: RawTask) => ({
                                    taskId: t.taskId,
                                    input: t.input,
                                    output: t.output,
                                    timestamp: t.timestamp,
                                    filesModified: t.filesModified || [],
                                    images: t.images || [],
                                    success: t.success,
                                    model: t.model
                                }));

                                return {
                                    projectId,
                                    agentId,
                                    isActive,
                                    currentTask: isActive ? lastTask : null,
                                    recentTasks,
                                    model: lastTask?.model || memory.modelId || 'unknown',
                                    thinkingMode: lastTask?.mode || memory.thinkingMode || 'standard',
                                    lastActive: memory.lastActive,
                                    stats: {
                                        totalTasks: memory.totalTasks,
                                        successRate: memory.successRate
                                    }
                                };
                            } catch {
                                return null;
                            }
                        })
                    );
                    return projectAgents.filter(Boolean);
                })
        );

        const flatAgents = agentStatuses.flat();
        return NextResponse.json({ agents: flatAgents });
    } catch (error) {
        console.error('Error fetching agent statuses:', error);
        return NextResponse.json({ agents: [] }, { status: 500 });
    }
}
