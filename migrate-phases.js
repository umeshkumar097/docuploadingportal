const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Migrating Candidates...');
  await prisma.candidate.updateMany({
    data: { phase: 'Phase 1' }
  });
  
  console.log('Migrating MasterEmployees...');
  await prisma.masterEmployee.updateMany({
    data: { phase: 'Phase 1' }
  });
  
  console.log('Migration complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
