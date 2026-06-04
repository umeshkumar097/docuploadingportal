require('dotenv').config({ path: '.env.local' });
if (!process.env.DATABASE_URL) {
  require('dotenv').config({ path: '.env' });
}
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Update Candidates
  const updatedCandidates = await prisma.candidate.updateMany({
    where: { 
      phase: {
        equals: 'jine phase 1',
        mode: 'insensitive'
      }
    },
    data: {
      phase: 'June Phase 1'
    }
  });

  // Update MasterData
  const updatedMD = await prisma.masterData.updateMany({
    where: { 
      phase: {
        equals: 'jine phase 1',
        mode: 'insensitive'
      }
    },
    data: {
      phase: 'June Phase 1'
    }
  });

  console.log(`Updated Candidates: ${updatedCandidates.count}`);
  console.log(`Updated Master Data: ${updatedMD.count}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
