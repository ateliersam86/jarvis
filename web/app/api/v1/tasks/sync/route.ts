import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

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

    await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsed: new Date() }
    })

    return apiKey.user
}

/**
 * POST /api/v1/tasks/sync
 * Sync tasks from local brain/task.md to dashboard
 * CLI sends: { projectId: "xxx", tasks: [...] }
 */
export async function POST(req: NextRequest) {
    try {
        const user = await authenticateToken(req)

        if (!user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const body = await req.json()
        const { projectId, projectSlug, tasks } = body

        if (!tasks || !Array.isArray(tasks)) {
            return NextResponse.json(
                { error: 'tasks array is required' },
                { status: 400 }
            )
        }

        // Find project by ID or slug
        let project = null
        if (projectId) {
            project = await prisma.project.findFirst({
                where: { id: projectId, userId: user.id }
            })
        } else if (projectSlug) {
            project = await prisma.project.findFirst({
                where: { slug: projectSlug, userId: user.id }
            })
        }

        if (!project) {
            return NextResponse.json(
                { error: 'Project not found. Sync project first.' },
                { status: 404 }
            )
        }

        // Process tasks: create or update each one
        const results = {
            created: 0,
            updated: 0,
            errors: 0,
        }

        for (const task of tasks) {
            try {
                // Look for existing task by title in this project
                const existingTask = await prisma.task.findFirst({
                    where: {
                        projectId: project.id,
                        title: task.title,
                    }
                })

                if (existingTask) {
                    // Update existing task
                    await prisma.task.update({
                        where: { id: existingTask.id },
                        data: {
                            status: task.status || existingTask.status,
                            description: task.description || existingTask.description,
                            priority: task.priority ?? existingTask.priority,
                        }
                    })
                    results.updated++
                } else {
                    // Create new task
                    await prisma.task.create({
                        data: {
                            title: task.title,
                            description: task.description || null,
                            status: task.status || 'PENDING',
                            priority: task.priority || 0,
                            projectId: project.id,
                        }
                    })
                    results.created++
                }
            } catch (err) {
                console.error('[tasks/sync] Error processing task:', task.title, err)
                results.errors++
            }
        }

        // Update project last synced
        await prisma.project.update({
            where: { id: project.id },
            data: { lastSynced: new Date() }
        })

        return NextResponse.json({
            success: true,
            projectId: project.id,
            projectName: project.name,
            results,
        })

    } catch (error) {
        console.error('[tasks/sync] Error:', error)
        return NextResponse.json(
            { error: 'Failed to sync tasks' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/v1/tasks/sync?projectId=xxx
 * Get tasks for a project (for CLI to pull dashboard tasks)
 */
export async function GET(req: NextRequest) {
    try {
        const user = await authenticateToken(req)

        if (!user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(req.url)
        const projectId = searchParams.get('projectId')
        const projectSlug = searchParams.get('projectSlug')

        let project = null
        if (projectId) {
            project = await prisma.project.findFirst({
                where: { id: projectId, userId: user.id }
            })
        } else if (projectSlug) {
            project = await prisma.project.findFirst({
                where: { slug: projectSlug, userId: user.id }
            })
        }

        if (!project) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            )
        }

        const tasks = await prisma.task.findMany({
            where: { projectId: project.id },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                description: true,
                status: true,
                priority: true,
                createdAt: true,
                updatedAt: true,
            }
        })

        return NextResponse.json({
            projectId: project.id,
            projectName: project.name,
            tasks,
        })

    } catch (error) {
        console.error('[tasks/sync] GET Error:', error)
        return NextResponse.json(
            { error: 'Failed to get tasks' },
            { status: 500 }
        )
    }
}
