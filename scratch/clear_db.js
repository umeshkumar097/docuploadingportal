const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

async function main() {
  const url = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const today = new Date('2026-05-01');
  
  try {
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
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
