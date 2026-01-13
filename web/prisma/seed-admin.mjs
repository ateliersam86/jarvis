import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@jarvis.local'
  const password = 'Jarvis2026!'
  
  const hashedPassword = await bcrypt.hash(password, 12)
  
  const user = await prisma.user.upsert({
    where: { email },
    update: { password: hashedPassword },
    create: {
      email,
      name: 'Admin Jarvis',
      password: hashedPassword,
    },
  })
  
  console.log('✅ Admin user created/updated:')
  console.log('  Email:', email)
  console.log('  Password: Jarvis2026!')
  console.log('  ID:', user.id)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
