import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get('projectId');
        
        const where = projectId ? { projectId } : {};

        const tasks = await prisma.task.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                agent: {
                    select: { name: true, model: true }
                }
            }
        });

        return NextResponse.json({ tasks });

    } catch (error) {
        console.error("Error fetching tasks:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
