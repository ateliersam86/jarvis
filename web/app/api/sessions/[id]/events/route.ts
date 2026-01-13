import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/sessions/[id]/events
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params; // Next.js 15 await params
    try {
        const events = await prisma.sessionEvent.findMany({
            where: { sessionId: id },
            orderBy: { timestamp: 'asc' }
        });

        return NextResponse.json({ events });
    } catch (_error) {
        return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }
}

// POST /api/sessions/[id]/events (Append event)
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await request.json();
        const { type, content, agentName, metadata } = body;

        const event = await prisma.sessionEvent.create({
            data: {
                sessionId: id,
                type, // AGENT_MSG, AGENT_THOUGHT, TOOL_CALL, etc.
                content,
                agentName,
                metadata: metadata ? JSON.stringify(metadata) : null,
            }
        });

        // Optional: Update session updated time if we add that field later

        return NextResponse.json({ event });
    } catch (error) {
        console.error('Failed to create event:', error);
        return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }
}
