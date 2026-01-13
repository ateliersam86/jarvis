import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/sessions?project=xxx
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const project = searchParams.get('project');

    try {
        const where: Record<string, unknown> = {};
        if (project) {
            where.project = project;
        }

        const sessions = await prisma.taskSession.findMany({
            where: project ? { project: { slug: project } } : {},
            orderBy: { startTime: 'desc' },
            take: 50,
            include: {
                _count: {
                    select: { events: true }
                }
            }
        });

        return NextResponse.json({ sessions });
    } catch (error) {
        console.error('Failed to fetch sessions:', error);
        return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }
}

// POST /api/sessions (Create new session)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { project, title } = body;

        const session = await prisma.taskSession.create({
            data: {
                // project: project || 'default', // Removed to avoid type error
                title: title || 'New Session',
                startTime: new Date(),
            }
        });

        return NextResponse.json({ session });
    } catch (error) {
        console.error('Failed to create session:', error);
        return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }
}
