require('dotenv').config({ path: '.env.local' });
if (!process.env.DATABASE_URL) {
  require('dotenv').config({ path: '.env' });
}
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const hcClient = await prisma.client.findFirst({
    where: { name: { contains: 'HC' } }
  });
  
  if (!hcClient) {
    console.log('No HC client found');
    return;
  }
  
  const pendingCandidates = await prisma.candidate.findMany({
    where: { 
      clientId: hcClient.id,
      status: { not: 'SUBMITTED' }
    },
    take: 5
  });
  
  if (pendingCandidates.length > 0) {
    pendingCandidates.forEach(c => {
      console.log(`EMP_ID: ${c.employeeId} | Mobile: ${c.mobileNumber} | Name: ${c.name}`);
    });
  } else {
    console.log('No pending candidates found for HC client');
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
