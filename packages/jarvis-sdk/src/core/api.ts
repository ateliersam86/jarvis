import axios, { AxiosInstance } from 'axios';
import { loadGlobalConfig, loadProjectConfig } from './config.js';

let client: AxiosInstance | null = null;

export async function getApiClient(): Promise<AxiosInstance> {
    if (client) return client;

    const config = await loadGlobalConfig();

    client = axios.create({
        baseURL: `${config.serverUrl}/api/v1`,
        headers: {
            'Content-Type': 'application/json',
            ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
        },
        timeout: 30000
    });

    return client;
}

export async function verifyAuth(): Promise<{ valid: boolean; user?: { id: string; name: string }; quota?: { limit: number; used: number; remaining: number } }> {
    try {
        const api = await getApiClient();
        const response = await api.post('/auth/verify');
        return response.data;
    } catch {
        return { valid: false };
    }
}

export async function createProject(name: string, type: string): Promise<{ id: string }> {
    const api = await getApiClient();
    const response = await api.post('/projects', { name, type });
    return response.data;
}

export async function syncMemory(projectId: string, context: object): Promise<void> {
    const api = await getApiClient();
    await api.put(`/projects/${projectId}/memory`, context);
}

export async function createTask(prompt: string, options: { mode?: string; model?: string }): Promise<{ taskId: string; wsChannel: string }> {
    const api = await getApiClient();
    const project = await loadProjectConfig();

    if (!project) {
        throw new Error('Project not initialized. Run `jarvis init` first.');
    }

    const response = await api.post('/tasks', {
        projectId: project.projectId,
        prompt,
        ...options
    });

    return response.data;
}

export async function getTaskStatus(taskId: string): Promise<{ status: string; progress: number }> {
    const api = await getApiClient();
    const response = await api.get(`/tasks/${taskId}/status`);
    return response.data;
}
