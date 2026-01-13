import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const agents = [
        {
            name: 'Gemini',
            role: 'Healer',
            model: 'gemini-1.5-flash',
            color: 'cyan',
            avatar: '/avatars/gemini.png'
        },
        {
            name: 'Claude',
            role: 'Architect',
            model: 'claude-3-5-sonnet',
            color: 'violet',
            avatar: '/avatars/claude.png'
        },
        {
            name: 'ChatGPT',
            role: 'Scripter',
            model: 'gpt-4o-mini',
            color: 'emerald',
            avatar: '/avatars/chatgpt.png'
        },
        {
            name: 'Jarvis',
            role: 'Orchestrator',
            model: 'claude-3-opus',
            color: 'blue',
            avatar: '/avatars/jarvis.png'
        }
    ]

    // Clear old "Codex" if it exists effectively by upserting new ones.
    // Ideally we might want to delete Codex, but for now let's just ensure the new ones are there.
    // We can delete Codex manually or just ignore it.

    // Let's delete "Codex" to avoid confusion if it exists
    try {
        await prisma.agent.delete({ where: { name: 'Codex' } })
    } catch (_e) {
        // Ignore if not found
    }

    for (const agent of agents) {
        await prisma.agent.upsert({
            where: { name: agent.name },
            update: agent, // Update existing fields to match new config
            create: agent,
        })
    }

    console.log('✅ Agents Seeded: Gemini, Claude, ChatGPT, Jarvis');
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
