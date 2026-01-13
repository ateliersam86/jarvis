import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// GET /api/user/apikeys - List user's API keys
export async function GET() {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const apiKeys = await prisma.apiKey.findMany({
        where: { userId: session.user.id },
        select: {
            id: true,
            name: true,
            prefix: true,
            createdAt: true,
            lastUsed: true,
            expiresAt: true,
        },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ apiKeys });
}

// POST /api/user/apikeys - Create a new API key
export async function POST(req: NextRequest) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    try {
        const { name, expiresAt } = await req.json();

        if (!name) {
            return NextResponse.json(
                { error: "Le nom de la clé est requis" },
                { status: 400 }
            );
        }

        // Generate a secure API key
        const rawKey = `jarvis_${crypto.randomBytes(32).toString("hex")}`;
        const prefix = rawKey.substring(0, 15);

        // Hash the key for storage
        const hashedKey = crypto.createHash("sha256").update(rawKey).digest("hex");

        const apiKey = await prisma.apiKey.create({
            data: {
                name,
                key: hashedKey,
                prefix,
                userId: session.user.id,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
            },
        });

        // Return the raw key ONLY on creation (it won't be shown again)
        return NextResponse.json({
            success: true,
            apiKey: {
                id: apiKey.id,
                name: apiKey.name,
                key: rawKey, // Only returned on creation!
                prefix: apiKey.prefix,
                createdAt: apiKey.createdAt,
                expiresAt: apiKey.expiresAt,
            },
            message: "Clé API créée ! 🔑 Copiez-la maintenant, elle ne sera plus affichée.",
        });
    } catch (error) {
        console.error("API key creation error:", error);
        return NextResponse.json(
            { error: "Erreur lors de la création de la clé" },
            { status: 500 }
        );
    }
}

// DELETE /api/user/apikeys - Revoke an API key
export async function DELETE(req: NextRequest) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    try {
        const { id } = await req.json();

        if (!id) {
            return NextResponse.json(
                { error: "L'ID de la clé est requis" },
                { status: 400 }
            );
        }

        // Verify the key belongs to the user
        const apiKey = await prisma.apiKey.findFirst({
            where: {
                id,
                userId: session.user.id,
            },
        });

        if (!apiKey) {
            return NextResponse.json(
                { error: "Clé API non trouvée" },
                { status: 404 }
            );
        }

        await prisma.apiKey.delete({
            where: { id },
        });

        return NextResponse.json({
            success: true,
            message: "Clé API révoquée ! 🗑️",
        });
    } catch (error) {
        console.error("API key deletion error:", error);
        return NextResponse.json(
            { error: "Erreur lors de la suppression de la clé" },
            { status: 500 }
        );
    }
}
