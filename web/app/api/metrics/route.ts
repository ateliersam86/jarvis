import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

/**
 * GET /api/metrics
 * Returns aggregated performance metrics for the dashboard.
 * Reads from the file-based memory system (.memory/projects/[project]/[agent].json).
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get('projectId') || 'jarvis';

        // Path to project memory
        // Assuming web/ is CWD, so .. gets us to root
        const memoryDir = path.join(process.cwd(), '..', '.memory', 'projects', projectId);

        let agentFiles: string[] = [];
        try {
            agentFiles = await fs.readdir(memoryDir);
        } catch (e) {
            return NextResponse.json({ 
                error: 'Project memory not found', 
                projectId,
                stats: { totalTasks: 0, successRate: 0, avgResponseTime: 0 },
                agents: []
            });
        }

        const agents = [];
        let globalTotalTasks = 0;
        let globalSuccessCount = 0;
        let globalTotalResponseTime = 0;
        let globalResponseTimeCount = 0;

        // Daily stats (last 7 days)
        const dailyStats: Record<string, { count: number, success: number, totalTime: number }> = {};

        for (const file of agentFiles) {
            if (!file.endsWith('.json')) continue;

            try {
                const content = await fs.readFile(path.join(memoryDir, file), 'utf-8');
                const data = JSON.parse(content);

                // Extract relevant metrics
                const totalTasks = data.totalTasks || 0;
                const successRate = data.successRate ?? 1;
                const avgResponseTime = data.performance?.averageResponseTime || 0;
                const recentTasks = data.recentTasks || [];

                // Update global counters
                globalTotalTasks += totalTasks;
                globalSuccessCount += (totalTasks * successRate);
                
                // For global avg time, we weight by task count
                // (Approximation if we don't have exact history for all tasks, but good enough)
                if (avgResponseTime > 0) {
                    globalTotalResponseTime += (avgResponseTime * totalTasks);
                    globalResponseTimeCount += totalTasks;
                }

                // Aggregate daily stats from recent tasks
                recentTasks.forEach((task: any) => {
                    if (!task.timestamp) return;
                    const date = task.timestamp.split('T')[0]; // YYYY-MM-DD
                    
                    if (!dailyStats[date]) {
                        dailyStats[date] = { count: 0, success: 0, totalTime: 0 };
                    }
                    dailyStats[date].count++;
                    if (task.success) dailyStats[date].success++;
                    if (task.responseTime) dailyStats[date].totalTime += task.responseTime;
                });

                agents.push({
                    id: data.workerId || file.replace('.json', ''),
                    model: data.modelId,
                    status: data.status,
                    lastActive: data.lastActive,
                    metrics: {
                        totalTasks,
                        successRate,
                        avgResponseTime,
                        errorRate: data.performance?.errorRate || 0
                    }
                });

            } catch (e) {
                console.warn(`Failed to parse agent file ${file}:`, e);
            }
        }

        // Calculate Global Averages
        const globalSuccessRate = globalTotalTasks > 0 ? (globalSuccessCount / globalTotalTasks) : 1;
        const globalAvgResponseTime = globalResponseTimeCount > 0 ? Math.round(globalTotalResponseTime / globalResponseTimeCount) : 0;

        // Format Daily Chart Data
        const chartData = Object.entries(dailyStats)
            .sort((a, b) => a[0].localeCompare(b[0])) // Sort by date
            .map(([date, stat]) => ({
                date,
                tasks: stat.count,
                successRate: stat.count > 0 ? stat.success / stat.count : 0,
                avgResponseTime: stat.count > 0 ? Math.round(stat.totalTime / stat.count) : 0
            }))
            .slice(-30); // Last 30 days max

        return NextResponse.json({
            projectId,
            overview: {
                totalTasks: globalTotalTasks,
                successRate: globalSuccessRate,
                avgResponseTime: globalAvgResponseTime,
                activeAgents: agents.length
            },
            chartData,
            agents
        });

    } catch (error) {
        console.error('[/api/metrics] Error:', error);
        return NextResponse.json({
            error: 'Failed to generate metrics',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
