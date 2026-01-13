import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("🔍 Listing Agents...");
    const agents = await prisma.agent.findMany();
    console.table(agents);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
