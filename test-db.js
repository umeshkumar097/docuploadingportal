const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const candidate = await prisma.candidate.findFirst({
    where: { name: 'Rahul Kumar' },
    orderBy: { createdAt: 'desc' }
  });
  console.log('Latest Candidate Rahul Kumar:', candidate);
  if (candidate && candidate.idType === 'PAN') {
    await prisma.candidate.update({
      where: { id: candidate.id },
      data: { idType: null }
    });
    console.log('Cleared idType for candidate.');
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
