import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.empleados.findMany({
    select: { id: true, email: true, requiere_login: true, is_active: true }
  });
  console.log(users);
}

main().finally(() => prisma.$disconnect());