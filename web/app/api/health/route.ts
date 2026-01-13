import { NextResponse } from 'next/server';

/**
 * Health check endpoint for Docker healthcheck and monitoring
 */
export async function GET() {
    try {
        // Basic health info
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                unit: 'MB'
            }
        };

        return NextResponse.json(health, { status: 200 });
    } catch {
        return NextResponse.json(
            { status: 'unhealthy', error: 'Health check failed' },
            { status: 500 }
        );
    }
}
