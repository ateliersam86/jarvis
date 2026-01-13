import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const encoder = new TextEncoder();
    const redisUrl = process.env.REDIS_URL || 'redis://jarvis-redis:6379';

    // Create a dedicate subscriber for this SSE stream (blocking op)
    const subscriber = new Redis(redisUrl);

    // Create a TransformStream for SSE
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    try {
        await subscriber.subscribe('jarvis:events');

        subscriber.on('message', async (channel, message) => {
            try {
                // message is JSON string
                // SSE format: data: <payload>\n\n
                const data = `data: ${message}\n\n`;
                await writer.write(encoder.encode(data));
            } catch (e) {
                console.error("Error writing to stream", e);
            }
        });

        // Keep connection alive
        const interval = setInterval(() => {
            if (!req.signal.aborted) {
                try {
                    writer.write(encoder.encode(': keep-alive\n\n'));
                } catch {
                    clearInterval(interval);
                }
            }
        }, 15000);

        req.signal.addEventListener('abort', async () => {
            clearInterval(interval);
            await subscriber.unsubscribe();
            subscriber.disconnect();
            await writer.close().catch(() => { });
        });

        return new NextResponse(stream.readable, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
            },
        });

    } catch (error) {
        console.error('SSE Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
