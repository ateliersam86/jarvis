import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export async function GET() {
    const session = await auth();
    if (!session || !session.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const keys = await prisma.apiKey.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' }
    });

    const safeKeys = keys.map(k => ({
        id: k.id,
        name: k.name,
        prefix: k.prefix,
        createdAt: k.createdAt,
        lastUsed: k.lastUsed,
    }));

    return NextResponse.json(safeKeys);
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session || !session.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { name } = await req.json();
    if (!name) return new NextResponse("Name required", { status: 400 });

    // Generate a secure key
    const rawKey = `jarvis_${crypto.randomBytes(16).toString('hex')}`;
    const prefix = rawKey.substring(0, 10) + '...';
    
    // Hash key for storage
    const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');

    const newKey = await prisma.apiKey.create({
        data: {
            userId: session.user.id,
            name,
            key: hashedKey,
            prefix: prefix,
        }
    });

    // Return the RAW key only once
    return NextResponse.json({
        id: newKey.id,
        name: newKey.name,
        prefix: newKey.prefix,
        createdAt: newKey.createdAt,
        fullKey: rawKey // Only returned on creation
    });
}

export async function DELETE(req: Request) {
    const session = await auth();
    if (!session || !session.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return new NextResponse("ID required", { status: 400 });

    await prisma.apiKey.deleteMany({
        where: {
            id,
            userId: session.user.id // Ensure ownership
        }
    });

    return NextResponse.json({ success: true });
}
