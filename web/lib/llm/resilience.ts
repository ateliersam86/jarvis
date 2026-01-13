import { v4 as uuidv4 } from 'uuid';

/**
 * Types for Resilience Strategy
 */

export interface ResilienceConfig {
    maxRetries: number;
    initialBackoffMs: number;
    timeoutMs: number;
    circuitBreakerThreshold: number; // Failures before opening
    circuitBreakerResetMs: number;   // Time before half-open
}

export const DEFAULT_CONFIG: ResilienceConfig = {
    maxRetries: 3,
    initialBackoffMs: 1000,
    timeoutMs: 30000,
    circuitBreakerThreshold: 5,
    circuitBreakerResetMs: 60000,
};

export type ExecutionResult<T> = {
    success: true;
    data: T;
    metadata: {
        attempts: number;
        provider: string;
        durationMs: number;
        fallbackUsed: boolean;
    };
} | {
    success: false;
    error: Error;
    metadata: {
        attempts: number;
        durationMs: number;
        lastProvider?: string;
    };
};

/**
 * Circuit Breaker State
 */
interface CircuitState {
    failures: number;
    lastFailure: number;
    isOpen: boolean;
}

const circuitStates = new Map<string, CircuitState>();

function getCircuitState(key: string): CircuitState {
    if (!circuitStates.has(key)) {
        circuitStates.set(key, { failures: 0, lastFailure: 0, isOpen: false });
    }
    return circuitStates.get(key)!;
}

function recordFailure(key: string, config: ResilienceConfig) {
    const state = getCircuitState(key);
    state.failures++;
    state.lastFailure = Date.now();
    if (state.failures >= config.circuitBreakerThreshold) {
        state.isOpen = true;
        console.warn(`[Resilience] Circuit breaker OPEN for ${key}`);
    }
}

function recordSuccess(key: string) {
    const state = getCircuitState(key);
    if (state.isOpen) {
        console.log(`[Resilience] Circuit breaker CLOSED for ${key}`);
    }
    state.failures = 0;
    state.isOpen = false;
}

function isCircuitOpen(key: string, config: ResilienceConfig): boolean {
    const state = getCircuitState(key);
    if (!state.isOpen) return false;

    // Check if reset timeout passed (Half-Open)
    if (Date.now() - state.lastFailure > config.circuitBreakerResetMs) {
        return false; // Allow one trial
    }
    return true;
}

/**
 * The Resilience Manager
 */
export class ResilienceManager {
    private config: ResilienceConfig;

    constructor(config: Partial<ResilienceConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Execute a task with Fallback Chain
     * @param providers List of async functions (providers) to try in order
     * @param contextIdentifier Identifier for Circuit Breaker (e.g., "gemini-translate")
     */
    async executeWithFallback<T>(
        providers: { name: string; fn: () => Promise<T> }[],
        contextIdentifier: string
    ): Promise<ExecutionResult<T>> {
        const startTime = Date.now();
        let attempts = 0;

        for (let i = 0; i < providers.length; i++) {
            const provider = providers[i];
            const circuitKey = `${contextIdentifier}:${provider.name}`;

            // 1. Check Circuit Breaker
            if (isCircuitOpen(circuitKey, this.config)) {
                console.warn(`[Resilience] Skipping ${provider.name} (Circuit Open)`);
                continue;
            }

            // 2. Try with Retry Logic
            attempts++;
            try {
                const result = await this.retry(provider.fn, circuitKey);
                recordSuccess(circuitKey);
                
                return {
                    success: true,
                    data: result,
                    metadata: {
                        attempts,
                        provider: provider.name,
                        durationMs: Date.now() - startTime,
                        fallbackUsed: i > 0
                    }
                };
            } catch (error) {
                console.error(`[Resilience] Provider ${provider.name} failed:`, error);
                recordFailure(circuitKey, this.config);
                // Continue to next provider
            }
        }

        return {
            success: false,
            error: new Error(`All ${providers.length} providers failed`),
            metadata: {
                attempts,
                durationMs: Date.now() - startTime,
                lastProvider: providers[providers.length - 1]?.name
            }
        };
    }

    /**
     * Retry wrapper with exponential backoff
     */
    private async retry<T>(fn: () => Promise<T>, circuitKey: string): Promise<T> {
        let lastError: any;
        
        for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
            try {
                // Timeout promise
                const timeoutPromise = new Promise<never>((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), this.config.timeoutMs)
                );
                
                return await Promise.race([fn(), timeoutPromise]);
            } catch (error) {
                lastError = error;
                if (attempt < this.config.maxRetries) {
                    const delay = this.config.initialBackoffMs * Math.pow(2, attempt - 1);
                    await new Promise(r => setTimeout(r, delay));
                }
            }
        }
        throw lastError;
    }
}

export const defaultResilience = new ResilienceManager();
