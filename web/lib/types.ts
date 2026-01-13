export interface Project {
    id: string;
    name: string;
    description?: string;
    icon: string;
    color?: string;
    subdomain?: string;
    techStack?: string[];
    activeAgents?: number;
    agentCount?: number;
    status?: 'active' | 'idle' | 'Active' | 'Idle';
}

export interface RecentTask {
    taskId: string;
    timestamp: string;
    type: string;
    input: string;
    output: string;
    success: boolean;
    responseTime: number;
    model: string;
    filesModified?: string[];
}

export interface WorkerData {
    workerId: string;
    projectId?: string;
    uniqueId?: string;
    status: 'online' | 'offline' | 'busy';
    modelId: string;
    lastActive: string;
    totalTasks: number;
    successRate: number;
    recentTasks: RecentTask[];
    expertise?: Record<string, number>;
    context?: {
        lastFiles: string[];
        lastTopics: string[];
        knownIssues: string[];
    };
    performance: {
        averageResponseTime: number;
        totalTokensUsed: number;
        errorRate: number;
    };
}

export interface TaskResult {
    projectId: string;
    agentId: string;
    task: string;
    status: 'success' | 'failure';
    output: string;
    model: string;
    responseTime: number;
    filesModified: string[];
}

export interface ProjectsResponse {
    projects: Project[];
    allWorkers: WorkerData[];
}
