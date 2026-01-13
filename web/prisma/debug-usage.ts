import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("🔍 Inspecting Resource Usage Table...");

    // 1. Get All Usage
    const allUsage = await prisma.resourceUsage.findMany({
        include: { agent: true }
    });

    console.log(`Found ${allUsage.length} usage records.`);

    // 2. Group by Agent using JS to be safe
    const grouped: Record<string, number> = {};

    allUsage.forEach(u => {
        const name = u.agent.name;
        if (!grouped[name]) grouped[name] = 0;
        grouped[name] += (u.tokensIn + u.tokensOut);

        console.log(`- [${u.timestamp.toISOString()}] ${name}: ${u.tokensIn + u.tokensOut} tokens`);
    });

    console.log("\n📊 Totals:");
    console.table(grouped);

    // 3. Test "Today" filter
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    console.log(`\n📅 Filtering after: ${startOfDay.toISOString()}`);

    const todayUsage = allUsage.filter(u => new Date(u.timestamp) >= startOfDay);
    console.log(`Found ${todayUsage.length} records for TODAY.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
