import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session || !session.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      settings: true,
      accounts: {
        select: {
          provider: true,
        }
      }
    },
  });

  if (!user) {
    return new NextResponse("User not found", { status: 404 });
  }

  // Transform for frontend
  const providers = user.accounts.map(a => a.provider);

  return NextResponse.json({
    name: user.name,
    email: user.email,
    image: user.image,
    settings: user.settings,
    providers: providers
  });
}

export async function PATCH(req: Request) {
    const session = await auth();

    if (!session || !session.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { name, settings } = body;

    // Update User
    if (name) {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { name },
        });
    }

    // Update Settings
    if (settings) {
        await prisma.userSettings.upsert({
            where: { userId: session.user.id },
            create: {
                userId: session.user.id,
                ...settings
            },
            update: {
                ...settings
            }
        });
    }

    return NextResponse.json({ success: true });
}
