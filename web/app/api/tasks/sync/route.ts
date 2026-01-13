import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * POST /api/tasks/sync
 * Called by Masterscript after each task completion to sync data with Dashboard.
 */
export async function POST(req: Request) {
    try {
        const data = await req.json();
        const {
            projectId = 'jarvis',
            agentId = 'gemini',
            task,
            status,
            output,
            model,
            responseTime = 0,
            filesModified = []
        } = data;

        // 1. Create a Session if not exists, then log the Event
        // For simplicity, we create a new session per day/project combo or use an active one
        let session = await prisma.taskSession.findFirst({
            where: {
                project: { slug: projectId },
                status: 'active'
            },
            orderBy: { startTime: 'desc' }
        });

        if (!session) {
            session = await prisma.taskSession.create({
                data: {
                    // project: projectId,
                    title: `CLI Session - ${new Date().toLocaleDateString()}`,
                    status: 'active'
                }
            });
        }

        // Log the SessionEvent
        await prisma.sessionEvent.create({
            data: {
                sessionId: session.id,
                type: status === 'success' ? 'AGENT_MSG' : 'SYSTEM',
                agentName: agentId,
                content: output?.slice(0, 10000) || '', // Truncate to 10KB
                metadata: JSON.stringify({ task, model, filesModified }),
                isProposal: false,
                approvalStatus: null
            }
        });

        // 2. Update the Worker JSON file
        const memoryDir = path.join(process.cwd(), '..', '.memory', 'projects', projectId);
        const workerFile = path.join(memoryDir, `${agentId}.json`);

        let currentMemory: Record<string, unknown> = {
            workerId: agentId,
            modelId: model || 'unknown',
            status: 'online',
            lastActive: new Date().toISOString(),
            totalTasks: 0,
            successRate: 1,
            recentTasks: [],
            expertise: {},
            context: { lastFiles: [], lastTopics: [], knownIssues: [] },
            performance: { averageResponseTime: 0, totalTokensUsed: 0, errorRate: 0 }
        };

        try {
            const fileContent = await fs.readFile(workerFile, 'utf-8');
            currentMemory = JSON.parse(fileContent);
        } catch {
            // File doesn't exist, use defaults
        }

        // Update memory
        const totalTasks = ((currentMemory.totalTasks as number) || 0) + 1;
        const successCount = status === 'success' ? 1 : 0;
        
        // Update Success Rate
        const prevSuccessRate = (currentMemory.successRate as number) || 1;
        // Formula: (OldRate * OldCount + NewSuccess) / NewCount
        const newSuccessRate = (prevSuccessRate * (totalTasks - 1) + successCount) / totalTasks;

        // Update Average Response Time
        const prevAvgTime = (currentMemory.performance as any)?.averageResponseTime || 0;
        const newAvgTime = (prevAvgTime * (totalTasks - 1) + responseTime) / totalTasks;

        // Update Error Rate
        const prevErrorRate = (currentMemory.performance as any)?.errorRate || 0;
        const isError = status === 'success' ? 0 : 1;
        const newErrorRate = (prevErrorRate * (totalTasks - 1) + isError) / totalTasks;

        const recentTasks = (currentMemory.recentTasks as any[]) || [];
        recentTasks.unshift({
            taskId: `cli-${Date.now()}`,
            timestamp: new Date().toISOString(),
            type: 'general',
            input: task?.slice(0, 1000) || '',
            output: output?.slice(0, 5000) || '',
            success: status === 'success',
            responseTime: responseTime,
            model: model || 'unknown',
            filesModified: filesModified
        });

        // Keep only last 50 tasks according to protocol
        if (recentTasks.length > 50) recentTasks.length = 50;

        const updatedMemory = {
            ...currentMemory,
            workerId: agentId,
            modelId: model || currentMemory.modelId || 'unknown',
            status: 'online',
            lastActive: new Date().toISOString(),
            totalTasks,
            successRate: newSuccessRate,
            recentTasks,
            expertise: currentMemory.expertise || {},
            context: {
                ...(currentMemory.context as Record<string, unknown> || {}),
                lastFiles: filesModified.slice(0, 10),
                lastTopics: (currentMemory.context as any)?.lastTopics || [],
                knownIssues: (currentMemory.context as any)?.knownIssues || []
            },
            performance: {
                averageResponseTime: Math.round(newAvgTime),
                totalTokensUsed: (currentMemory.performance as any)?.totalTokensUsed || 0,
                errorRate: newErrorRate
            }
        };

        await fs.mkdir(memoryDir, { recursive: true });
        await fs.writeFile(workerFile, JSON.stringify(updatedMemory, null, 4));

        return NextResponse.json({
            success: true,
            sessionId: session.id,
            message: 'Dashboard synchronized'
        });

    } catch (error) {
        console.error('[/api/tasks/sync] Error:', error);
        return NextResponse.json({
            error: 'Failed to sync task',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
