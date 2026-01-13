/**
 * Simple in-memory rate limiter for API routes
 * Production should use Redis-based rate limiting
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap.entries()) {
        if (entry.resetTime < now) {
            rateLimitMap.delete(key);
        }
    }
}, 60000); // Clean every minute

export interface RateLimitConfig {
    windowMs: number;  // Time window in ms
    maxRequests: number;  // Max requests per window
}

export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig = { windowMs: 60000, maxRequests: 30 }
): { allowed: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    const key = identifier;

    let entry = rateLimitMap.get(key);

    if (!entry || entry.resetTime < now) {
        // Create new entry
        entry = {
            count: 1,
            resetTime: now + config.windowMs,
        };
        rateLimitMap.set(key, entry);
        return {
            allowed: true,
            remaining: config.maxRequests - 1,
            resetIn: config.windowMs,
        };
    }

    entry.count++;

    if (entry.count > config.maxRequests) {
        return {
            allowed: false,
            remaining: 0,
            resetIn: entry.resetTime - now,
        };
    }

    return {
        allowed: true,
        remaining: config.maxRequests - entry.count,
        resetIn: entry.resetTime - now,
    };
}

// Rate limit configurations for different routes
export const RATE_LIMITS = {
    // Strict for expensive AI operations
    aiChat: { windowMs: 60000, maxRequests: 10 },
    // Moderate for regular API
    api: { windowMs: 60000, maxRequests: 60 },
    // Lenient for auth
    auth: { windowMs: 60000, maxRequests: 20 },
};
