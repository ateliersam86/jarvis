// Logger removed


// Constants from the extension
export const CLOUDCODE_BASE_URLS = [
    'https://cloudcode-pa.googleapis.com',
    'https://daily-cloudcode-pa.sandbox.googleapis.com',
] as const;

export const CLOUDCODE_METADATA = {
    ideType: 'ANTIGRAVITY',
    platform: 'PLATFORM_UNSPECIFIED',
    pluginType: 'GEMINI',
};

// Types
export interface CloudCodeProjectInfo {
    projectId?: string;
    tierId?: string;
}

export interface CloudCodeQuotaResponse {
    models?: Record<string, {
        displayName?: string;
        model?: string;
        quotaInfo?: {
            remainingFraction?: number;
            resetTime?: string;
        };
    }>;
}

interface LoadCodeAssistResponse {
    cloudaicompanionProject?: { id: string };
    paidTier?: { id: string };
    currentTier?: { id: string };
}

export class CloudCodeClient {
    private buildUrl(baseUrl: string, path: string): string {
        return `${baseUrl}${path}`;
    }

    async resolveProjectId(accessToken: string): Promise<CloudCodeProjectInfo> {
        // Simplified Logic: Just try to load project info
        const payload = { metadata: CLOUDCODE_METADATA };
        const data = await this.requestJson<LoadCodeAssistResponse>(
            '/v1internal:loadCodeAssist',
            payload,
            accessToken
        );

        const projectId = data?.cloudaicompanionProject?.id;
        const tierId = data?.paidTier?.id || data?.currentTier?.id;

        return { projectId, tierId };
    }

    async fetchAvailableModels(accessToken: string, projectId?: string): Promise<CloudCodeQuotaResponse> {
        const payload = projectId ? { project: projectId } : {};
        return this.requestJson<CloudCodeQuotaResponse>(
            '/v1internal:fetchAvailableModels',
            payload,
            accessToken
        );
    }

    private async requestJson<T>(path: string, body: object, accessToken: string): Promise<T> {
        for (const baseUrl of CLOUDCODE_BASE_URLS) {
            try {
                const url = this.buildUrl(baseUrl, path);
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'User-Agent': 'antigravity',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(body),
                });

                if (response.ok) {
                    return await response.json() as T;
                }

                // If 403 or 401, throw immediately
                if (response.status === 401 || response.status === 403) {
                    throw new Error(`Auth Error: ${response.status}`);
                }

            } catch (e) {
                console.error(`Request to ${baseUrl} failed`, e);
                // Try next base URL
            }
        }
        throw new Error('All Cloud Code endpoints failed');
    }
}

export const cloudCodeClient = new CloudCodeClient();