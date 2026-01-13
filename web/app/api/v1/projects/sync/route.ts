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
 * POST /api/v1/projects/sync
 * Create or update a project based on local path
 * CLI sends: { localPath: "/path/to/project", name: "project-name" }
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
        const { localPath, name, description } = body

        if (!localPath || !name) {
            return NextResponse.json(
                { error: 'localPath and name are required' },
                { status: 400 }
            )
        }

        // Generate slug from name
        const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')

        // Check if project exists (by slug or localPath)
        let project = await prisma.project.findFirst({
            where: {
                userId: user.id,
                OR: [
                    { slug: slug },
                    { localPath: localPath }
                ]
            }
        })

        if (project) {
            // Update existing project
            project = await prisma.project.update({
                where: { id: project.id },
                data: {
                    name,
                    localPath,
                    description: description || project.description,
                    lastSynced: new Date(),
                }
            })

            return NextResponse.json({
                success: true,
                action: 'updated',
                project: {
                    id: project.id,
                    name: project.name,
                    slug: project.slug,
                    localPath: project.localPath,
                }
            })
        } else {
            // Create new project
            project = await prisma.project.create({
                data: {
                    name,
                    slug,
                    localPath,
                    description: description || null,
                    userId: user.id,
                    lastSynced: new Date(),
                }
            })

            return NextResponse.json({
                success: true,
                action: 'created',
                project: {
                    id: project.id,
                    name: project.name,
                    slug: project.slug,
                    localPath: project.localPath,
                }
            }, { status: 201 })
        }

    } catch (error) {
        console.error('[projects/sync] Error:', error)
        return NextResponse.json(
            { error: 'Failed to sync project' },
            { status: 500 }
        )
    }
}
