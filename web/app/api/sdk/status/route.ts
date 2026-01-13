import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

/**
 * POST /api/sdk/status
 * 
 * Called by SDK to report:
 * - Installed CLIs
 * - Authentication status
 * - Quota information
 * - Environment type
 */
export async function POST(req: NextRequest) {
    try {
        // Auth can be via session OR API key
        const session = await auth();
        let userId = session?.user?.id;

        // Check for API key auth if no session
        if (!userId) {
            const authHeader = req.headers.get('authorization');
            if (authHeader?.startsWith('Bearer jarvis_')) {
                const apiKey = authHeader.replace('Bearer ', '');
                // Hash the key to compare with stored hash
                const crypto = await import('crypto');
                const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');

                const keyRecord = await prisma.apiKey.findUnique({
                    where: { key: hashedKey },
                    include: { user: true },
                });

                if (keyRecord) {
                    userId = keyRecord.userId;
                    // Update last used timestamp
                    await prisma.apiKey.update({
                        where: { id: keyRecord.id },
                        data: { lastUsed: new Date() },
                    });
                }
            }
        }

        if (!userId) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const data = await req.json();

        const {
            environment,  // { type, platform, isAntigravity, isVSCode, etc. }
            clis,         // { gemini: { installed, authenticated, quota }, ... }
            projectSlug,  // optional: current project
        } = data;

        // Update user settings with CLI connection status
        await prisma.userSettings.upsert({
            where: { userId },
            create: {
                userId,
                geminiConnected: clis?.gemini?.authenticated || false,
                claudeConnected: clis?.claude?.authenticated || false,
                openaiConnected: clis?.codex?.authenticated || false,
            },
            update: {
                geminiConnected: clis?.gemini?.authenticated || false,
                claudeConnected: clis?.claude?.authenticated || false,
                openaiConnected: clis?.codex?.authenticated || false,
            },
        });

        // If project slug provided, update project context
        if (projectSlug) {
            await prisma.project.updateMany({
                where: { userId, slug: projectSlug },
                data: {
                    context: JSON.stringify({
                        environment,
                        clis,
                        lastReported: new Date().toISOString(),
                    }),
                    lastSynced: new Date(),
                },
            });
        }

        return NextResponse.json({
            success: true,
            message: "Status mis à jour ! 🔄",
        });
    } catch (error) {
        console.error("SDK status error:", error);
        return NextResponse.json(
            { error: "Erreur lors de la mise à jour du status" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/sdk/status
 * 
 * Returns SDK configuration for the authenticated user
 */
export async function GET() {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const settings = await prisma.userSettings.findUnique({
        where: { userId: session.user.id },
    });

    const projects = await prisma.project.findMany({
        where: { userId: session.user.id },
        select: {
            slug: true,
            name: true,
            localPath: true,
            context: true,
            lastSynced: true,
        },
    });

    return NextResponse.json({
        user: {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
        },
        settings: {
            preferredModel: settings?.preferredModel || 'gemini:pro',
            geminiConnected: settings?.geminiConnected || false,
            claudeConnected: settings?.claudeConnected || false,
            openaiConnected: settings?.openaiConnected || false,
        },
        projects,
    });
}
