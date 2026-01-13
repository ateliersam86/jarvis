import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// GET /api/user/projects - List user's projects
export async function GET() {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const projects = await prisma.project.findMany({
        where: { userId: session.user.id },
        orderBy: { updatedAt: "desc" },
        include: {
            _count: {
                select: { taskSessions: true },
            },
        },
    });

    return NextResponse.json({ projects });
}

// POST /api/user/projects - Create a new project
export async function POST(req: NextRequest) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    try {
        const { name, description, localPath, repoUrl } = await req.json();

        if (!name) {
            return NextResponse.json(
                { error: "Le nom du projet est requis" },
                { status: 400 }
            );
        }

        // Generate slug from name
        const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

        // Check if slug already exists for this user
        const existing = await prisma.project.findFirst({
            where: {
                userId: session.user.id,
                slug,
            },
        });

        if (existing) {
            return NextResponse.json(
                { error: "Un projet avec ce nom existe déjà" },
                { status: 409 }
            );
        }

        const project = await prisma.project.create({
            data: {
                name,
                slug,
                description,
                localPath,
                repoUrl,
                userId: session.user.id,
            },
        });

        return NextResponse.json({
            success: true,
            project,
            message: "Projet créé ! 🚀",
        });
    } catch (error) {
        console.error("Project creation error:", error);
        return NextResponse.json(
            { error: "Erreur lors de la création du projet" },
            { status: 500 }
        );
    }
}
