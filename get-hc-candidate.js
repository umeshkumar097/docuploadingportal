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
  
  const pendingCandidate = await prisma.candidate.findFirst({
    where: { 
      clientId: hcClient.id,
      status: { not: 'SUBMITTED' }
    }
  });
  
  if (pendingCandidate) {
    console.log(`Employee ID: ${pendingCandidate.employeeId}`);
    console.log(`Mobile: ${pendingCandidate.mobileNumber}`);
    console.log(`Name: ${pendingCandidate.name}`);
  } else {
    console.log('No pending candidates found for HC client');
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
