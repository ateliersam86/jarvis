import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET() {
    try {
        const agents = await prisma.agent.findMany({
            include: {
                resourceUsage: {
                    where: {
                        timestamp: {
                            gte: new Date(new Date().setUTCHours(0, 0, 0, 0))
                        }
                    }
                },
            },
        });

        const stats = agents.map((agent) => {
            const totalTokens = agent.resourceUsage.reduce((acc, curr) => acc + curr.tokensIn + curr.tokensOut, 0);
            const totalCost = agent.resourceUsage.reduce((acc, curr) => acc + curr.cost, 0);

            // Realistic Limits (Tokens per Day - Estimated Tiers)
            let dailyLimit = 100000; // Fallback
            if (agent.name.includes('Gemini')) dailyLimit = 4000000; // Flash is cheap
            else if (agent.name.includes('Claude')) dailyLimit = 1000000; // Sonnet is mid-tier
            else if (agent.name.includes('ChatGPT')) dailyLimit = 2000000; // 4o-mini is efficient

            // Calculate Reset Time (Next UTC Midnight)
            const now = new Date();
            const resetTime = new Date(now);
            resetTime.setUTCHours(24, 0, 0, 0);
            const msUntilReset = resetTime.getTime() - now.getTime();

            // Format Reset Time (e.g. "4h 32m")
            const hours = Math.floor(msUntilReset / (1000 * 60 * 60));
            const minutes = Math.floor((msUntilReset % (1000 * 60 * 60)) / (1000 * 60));
            const resetString = `${hours}h ${minutes}m`;

            return {
                id: agent.id, // Frontend expects 'id', not 'agentId'
                agentId: agent.id, // Keep for compatibility if needed
                name: agent.name,
                role: agent.role,
                color: agent.color,
                totalTokens,
                totalCost,
                limit: dailyLimit, // Pass limit to frontend

                percentUsed: Math.min((totalTokens / dailyLimit) * 100, 100),
                resetTime: resetString,
                lastUpdated: new Date().toISOString()
            };
        });

        return NextResponse.json({ stats });
    } catch (error) {
        console.error('Usage API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
