/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const agents = await prisma.agent.findMany();
    console.log("AGENTS IN DB:");
    agents.forEach(a => console.log(`${a.name}: ${a.id}`));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
