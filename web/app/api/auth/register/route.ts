import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const { email, password, name } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email et mot de passe requis" },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "Un compte existe déjà avec cet email" },
                { status: 409 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                name: name || email.split("@")[0],
                password: hashedPassword,
            },
        });

        // Create default settings
        await prisma.userSettings.create({
            data: { userId: user.id },
        });

        return NextResponse.json({
            success: true,
            message: "Compte créé avec succès ! 🎉",
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        });
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Erreur lors de la création du compte" },
            { status: 500 }
        );
    }
}
