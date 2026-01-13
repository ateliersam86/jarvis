/**
 * Secure API Route Wrapper
 * Combines rate limiting, authentication, and error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { checkRateLimit, RateLimitConfig, RATE_LIMITS } from './rateLimit';

interface SecureRouteOptions {
    requireAuth?: boolean;
    rateLimit?: RateLimitConfig;
}

type RouteHandler = (
    request: NextRequest,
    context: { userId?: string; params?: Record<string, string> }
) => Promise<NextResponse>;

/**
 * Wrap an API route with security features
 */
export function secureRoute(
    handler: RouteHandler,
    options: SecureRouteOptions = {}
) {
    const { requireAuth = false, rateLimit = RATE_LIMITS.api } = options;

    return async (request: NextRequest, context?: { params?: Record<string, string> }) => {
        try {
            // 1. Rate Limiting
            const ip = request.headers.get('x-forwarded-for') ||
                request.headers.get('x-real-ip') ||
                'unknown';
            const rateLimitKey = `${ip}:${request.nextUrl.pathname}`;

            const limit = checkRateLimit(rateLimitKey, rateLimit);
            if (!limit.allowed) {
                return NextResponse.json(
                    { error: 'Too many requests. Please try again later.' },
                    {
                        status: 429,
                        headers: {
                            'Retry-After': String(Math.ceil(limit.resetIn / 1000)),
                            'X-RateLimit-Remaining': '0',
                        }
                    }
                );
            }

            // 2. Authentication (if required)
            let userId: string | undefined;
            if (requireAuth) {
                const token = await getToken({
                    req: request,
                    secret: process.env.AUTH_SECRET,
                });

                if (!token?.sub) {
                    return NextResponse.json(
                        { error: 'Unauthorized. Please log in.' },
                        { status: 401 }
                    );
                }
                userId = token.sub;
            }

            // 3. Execute handler
            const response = await handler(request, {
                userId,
                params: context?.params
            });

            // Add rate limit headers to response
            response.headers.set('X-RateLimit-Remaining', String(limit.remaining));

            return response;

        } catch (error) {
            console.error('API Error:', error);
            return NextResponse.json(
                { error: 'Internal server error' },
                { status: 500 }
            );
        }
    };
}

/**
 * Pre-configured secure route for AI operations (strict rate limit)
 */
export function secureAIRoute(handler: RouteHandler) {
    return secureRoute(handler, {
        requireAuth: true,
        rateLimit: RATE_LIMITS.aiChat,
    });
}

/**
 * Pre-configured secure route for authenticated endpoints
 */
export function secureAuthRoute(handler: RouteHandler) {
    return secureRoute(handler, {
        requireAuth: true,
        rateLimit: RATE_LIMITS.api,
    });
}
