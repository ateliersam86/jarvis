import { cosmiconfig } from 'cosmiconfig';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export interface JarvisConfig {
    apiKey?: string;
    serverUrl: string;
    userId?: string;
}

export interface ProjectConfig {
    projectId: string;
    name: string;
    type: string;
    createdAt: string;
}

const explorer = cosmiconfig('jarvis');
const CONFIG_PATH = path.join(os.homedir(), '.jarvisrc');
const DEFAULT_SERVER = 'https://jarvis.atelier-sam.fr';

export async function loadGlobalConfig(): Promise<JarvisConfig> {
    try {
        const result = await explorer.search(os.homedir());
        if (result?.config) {
            return {
                serverUrl: DEFAULT_SERVER,
                ...result.config
            };
        }
    } catch {
        // Config doesn't exist yet
    }

    return { serverUrl: DEFAULT_SERVER };
}

export async function saveGlobalConfig(config: Partial<JarvisConfig>): Promise<void> {
    const existing = await loadGlobalConfig();
    const merged = { ...existing, ...config };

    await fs.writeFile(CONFIG_PATH, JSON.stringify(merged, null, 2));
}

export async function loadProjectConfig(): Promise<ProjectConfig | null> {
    const configPath = path.join(process.cwd(), '.jarvis', 'config.json');

    try {
        const content = await fs.readFile(configPath, 'utf-8');
        return JSON.parse(content);
    } catch {
        return null;
    }
}

export async function saveProjectConfig(config: ProjectConfig): Promise<void> {
    const configDir = path.join(process.cwd(), '.jarvis');
    const configPath = path.join(configDir, 'config.json');

    await fs.mkdir(configDir, { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
}

export function isAuthenticated(config: JarvisConfig): boolean {
    return !!config.apiKey;
}
