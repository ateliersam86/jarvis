import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

// Use a global prisma instance to avoid "too many connections" in dev
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Map DB Agent ID/Name to Worker Type
const WORKER_MAP: Record<string, string> = {
    'Gemini': 'GEMINI',
    'Claude': 'CLAUDE',
    'ChatGPT': 'CHATGPT',
    'Jarvis': 'CLAUDE',
    'Codex': 'CHATGPT'
};

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const agentId = searchParams.get('agentId');

        if (!agentId) return NextResponse.json([], { status: 400 });

        const messages = await prisma.message.findMany({
            where: {
                conversation: {
                    agentId: agentId
                }
            },
            orderBy: { createdAt: 'asc' },
            take: 50
        });

        return NextResponse.json({ messages });
    } catch {
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { agentId, message } = await req.json();

        // 1. Get Agent details
        const agent = await prisma.agent.findUnique({
            where: { id: agentId }
        });

        if (!agent) {
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
        }

        const workerType = WORKER_MAP[agent.name] || 'GEMINI'; // Fallback
        const requestId = uuidv4();

        // 2. Setup Redis (using ioredis)
        const redisUrl = process.env.REDIS_URL || 'redis://jarvis-redis:6379';
        console.log(`[API] Connecting to Redis at ${redisUrl}...`);

        // Use separate instances for Pub and Sub (ioredis best practice for blocking ops)
        const publisher = new Redis(redisUrl);
        const subscriber = new Redis(redisUrl);

        interface WorkerResponse {
            content?: string;
            error?: string;
            usage?: {
                tokensIn?: number;
                tokensOut?: number;
                cost?: number;
            }
        }

        // 3. Create a Promise that resolves when the worker responds
        const responsePromise = new Promise<WorkerResponse>(async (resolve) => {
            const timeout = setTimeout(() => {
                resolve({ error: 'Timeout waiting for agent response' });
            }, 60000); // 60s timeout

            // ioredis subscribe
            await subscriber.subscribe(`jarvis:response:${requestId}`);

            subscriber.on('message', (channel, message) => {
                if (channel === `jarvis:response:${requestId}`) {
                    clearTimeout(timeout);
                    try {
                        const data = JSON.parse(message);
                        resolve(data);
                    } catch {
                        resolve({ error: 'Invalid response format' });
                    }
                    subscriber.disconnect(); // Clean up
                }
            });
        });

        // 3a. Create Session for Event Logging
        const session = await prisma.taskSession.create({
            data: {
                // project: 'jarvis', // Default for now, should be dynamic
                title: `Chat with ${agent.name} (${requestId.slice(0, 8)})`,
            }
        });

        // 4. Publish Job
        await publisher.publish(`jarvis:jobs:${workerType}`, JSON.stringify({
            id: uuidv4(),
            requestId: requestId,
            sessionId: session.id, // Pass to worker
            content: message
        }));

        // 5. Wait for result
        const result = await responsePromise;

        await publisher.quit();

        if (result.error) {
            return NextResponse.json({ message: { role: 'assistant', content: `⚠️ Error: ${result.error}` } });
        }

        // 6. Save Interaction to DB
        let conversation = await prisma.conversation.findFirst({
            where: { agentId },
            orderBy: { updatedAt: 'desc' },
        });

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: { agentId, title: 'Swarm Chat' },
            });
        }

        const messageEntries = [
            { conversationId: conversation.id, role: 'user', content: message },
            { conversationId: conversation.id, role: 'assistant', content: result.content }
        ];

        await prisma.message.createMany({ data: messageEntries });

        // 7. Save Resource Usage
        if (result.usage) {
            console.log(`[API] Saving Usage for ${agent.name}:`, result.usage);
            await prisma.resourceUsage.create({
                data: {
                    agentId: agent.id,
                    tokensIn: result.usage.tokensIn || 0,
                    tokensOut: result.usage.tokensOut || 0,
                    cost: result.usage.cost || 0
                }
            });
        } else {
            console.log(`[API] No usage data in response from ${workerType}`);
        }

        return NextResponse.json({
            message: {
                role: 'assistant',
                content: result.content
            }
        });

    } catch (_e) {
        console.error("Chat API Error:", _e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
