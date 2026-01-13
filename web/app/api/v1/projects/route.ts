import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import { auth } from '@/lib/auth'

const prisma = new PrismaClient()

/**
 * Helper: Authenticate via Bearer token
 */
async function authenticateToken(req: NextRequest) {
    const authHeader = req.headers.get('authorization')

    if (!authHeader?.startsWith('Bearer ')) {
        return null
    }

    const rawToken = authHeader.split(' ')[1]
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex')

    const apiKey = await prisma.apiKey.findUnique({
        where: { key: hashedToken },
        include: { user: true }
    })

    if (!apiKey || (apiKey.expiresAt && apiKey.expiresAt < new Date())) {
        return null
    }

    // Update last used
    await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsed: new Date() }
    })

    return apiKey.user
}

/**
 * GET /api/v1/projects
 * List user's projects
 */
export async function GET(req: NextRequest) {
    try {
        // 1. Try Bearer Token
        let user = await authenticateToken(req)

        // 2. Fallback to Session Auth
        if (!user) {
            const session = await auth()
            if (session?.user?.id) {
                // Mock a user object with just the ID, as that's all we need
                user = { id: session.user.id } as any
            }
        }

        if (!user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const projects = await prisma.project.findMany({
            where: { userId: user.id },
            orderBy: { updatedAt: 'desc' },
            include: {
                _count: {
                    select: { tasks: true }
                }
            }
        })

        return NextResponse.json({
            projects: projects.map(p => ({
                id: p.id,
                name: p.name,
                slug: p.slug,
                description: p.description,
                color: p.color,
                localPath: p.localPath,
                taskCount: p._count.tasks,
                lastSynced: p.lastSynced,
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,
            }))
        })

    } catch (error) {
        console.error('[projects] GET Error:', error)
        return NextResponse.json(
            { error: 'Failed to list projects' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/v1/projects
 * Create a new project (from CLI or dashboard)
 */
export async function POST(req: NextRequest) {
    try {
        let user = await authenticateToken(req)

        if (!user) {
            const session = await auth()
            if (session?.user?.id) {
                user = { id: session.user.id } as any
            }
        }

        if (!user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const body = await req.json()
        const { name, description, localPath, color } = body

        if (!name) {
            return NextResponse.json(
                { error: 'Project name required' },
                { status: 400 }
            )
        }

        // Generate slug from name
        const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')

        // Check if slug already exists for this user
        const existing = await prisma.project.findUnique({
            where: {
                userId_slug: {
                    userId: user.id,
                    slug: slug
                }
            }
        })

        if (existing) {
            return NextResponse.json(
                { error: 'Project with this name already exists' },
                { status: 409 }
            )
        }

        const project = await prisma.project.create({
            data: {
                name,
                slug,
                description: description || null,
                localPath: localPath || null,
                color: color || '#3b82f6',
                userId: user.id,
            }
        })

        return NextResponse.json({
            success: true,
            project: {
                id: project.id,
                name: project.name,
                slug: project.slug,
                description: project.description,
                color: project.color,
                localPath: project.localPath,
            }
        }, { status: 201 })

    } catch (error) {
        console.error('[projects] POST Error:', error)
        return NextResponse.json(
            { error: 'Failed to create project' },
            { status: 500 }
        )
    }
}