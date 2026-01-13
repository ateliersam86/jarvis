import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// Proxy to /api/v1/projects - returns same data but from this endpoint
// This maintains backward compatibility for any legacy code calling /api/projects
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const projects = await prisma.project.findMany({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: { tasks: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Transform to match expected format
    const enrichedProjects = projects.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description || '',
      color: p.color || '#3b82f6',
      localPath: p.localPath,
      taskCount: p._count.tasks,
      lastSynced: p.lastSynced,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));

    return NextResponse.json({ projects: enrichedProjects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}