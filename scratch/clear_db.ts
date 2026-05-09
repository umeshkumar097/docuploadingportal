import prisma from '../src/lib/prisma';

async function clearToday() {
  const today = new Date('2026-05-01');
  
  // First, delete related documents to avoid foreign key violations
  const deletedDocs = await prisma.document.deleteMany({
    where: {
      createdAt: { gte: today }
    }
  });
  
  const deletedCandidates = await prisma.candidate.deleteMany({
    where: {
      createdAt: { gte: today }
    }
  });
  
  console.log(`Deleted ${deletedDocs.count} documents created today.`);
  console.log(`Deleted ${deletedCandidates.count} candidates created today.`);
}

clearToday().catch(console.error).finally(() => process.exit());
