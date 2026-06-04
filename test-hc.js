const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const clients = await prisma.client.findMany({
    where: { name: { contains: 'HC' } }
  });
  console.log('Clients:', clients);
  if (clients.length > 0) {
    const md = await prisma.masterData.findFirst({
      where: { clientId: clients[0].id }
    });
    console.log('Sample MasterData:', md);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
