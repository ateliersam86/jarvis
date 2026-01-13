import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ valid: false, error: "Missing token" }, { status: 401 });
    }

    const rawKey = authHeader.split(" ")[1];
    const hashedKey = crypto.createHash("sha256").update(rawKey).digest("hex");

    const apiKey = await prisma.apiKey.findUnique({
      where: { key: hashedKey },
      include: {
        user: true
      }
    });

    if (!apiKey) {
      return NextResponse.json({ valid: false, error: "Invalid token" }, { status: 401 });
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return NextResponse.json({ valid: false, error: "Token expired" }, { status: 401 });
    }

    // Update last used
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsed: new Date() }
    });

    // Mock Quota for now (or calculate if possible)
    const quota = {
      limit: 1000000,
      used: 12345, // TODO: Calculate real usage
      remaining: 987655
    };

    return NextResponse.json({
      valid: true,
      user: {
        id: apiKey.user.id,
        name: apiKey.user.name,
        email: apiKey.user.email
      },
      quota
    });

  } catch (error) {
    console.error("Auth verification failed:", error);
    return NextResponse.json({ valid: false, error: "Internal Error" }, { status: 500 });
  }
}
