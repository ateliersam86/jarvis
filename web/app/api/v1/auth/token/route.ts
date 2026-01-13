import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from '@/auth'
import crypto from 'crypto'

const prisma = new PrismaClient()

/**
 * POST /api/v1/auth/token
 * Generate a new CLI API token for the authenticated user
 */
export async function POST(req: NextRequest) {
    try {
        // Get user session
        const session = await auth()

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        // Parse request body for optional name
        let tokenName = 'CLI Token'
        try {
            const body = await req.json()
            if (body.name) tokenName = body.name
        } catch {
            // No body provided, use default name
        }

        // Generate token: jarvis_<random 32 bytes hex>
        const rawToken = `jarvis_${crypto.randomBytes(32).toString('hex')}`
        const prefix = rawToken.substring(0, 12) // "jarvis_xxxx"
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex')

        // Store hashed token in database
        const apiKey = await prisma.apiKey.create({
            data: {
                name: tokenName,
                key: hashedToken,
                prefix: prefix,
                userId: user.id,
                expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
            }
        })

        // Return the raw token (only time it's visible)
        return NextResponse.json({
            success: true,
            token: rawToken,
            prefix: prefix,
            name: apiKey.name,
            expiresAt: apiKey.expiresAt,
            message: 'Save this token securely. It will not be shown again.'
        })

    } catch (error) {
        console.error('[auth/token] Error:', error)
        return NextResponse.json(
            { error: 'Failed to generate token' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/v1/auth/token
 * List user's API tokens (without the actual keys)
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                apiKeys: {
                    select: {
                        id: true,
                        name: true,
                        prefix: true,
                        createdAt: true,
                        lastUsed: true,
                        expiresAt: true,
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        })

        return NextResponse.json({
            tokens: user?.apiKeys || []
        })

    } catch (error) {
        console.error('[auth/token] GET Error:', error)
        return NextResponse.json(
            { error: 'Failed to list tokens' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/v1/auth/token
 * Revoke an API token
 */
export async function DELETE(req: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(req.url)
        const tokenId = searchParams.get('id')

        if (!tokenId) {
            return NextResponse.json(
                { error: 'Token ID required' },
                { status: 400 }
            )
        }

        // Verify ownership before deleting
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        const apiKey = await prisma.apiKey.findFirst({
            where: {
                id: tokenId,
                userId: user?.id
            }
        })

        if (!apiKey) {
            return NextResponse.json(
                { error: 'Token not found' },
                { status: 404 }
            )
        }

        await prisma.apiKey.delete({
            where: { id: tokenId }
        })

        return NextResponse.json({
            success: true,
            message: 'Token revoked'
        })

    } catch (error) {
        console.error('[auth/token] DELETE Error:', error)
        return NextResponse.json(
            { error: 'Failed to revoke token' },
            { status: 500 }
        )
    }
}
