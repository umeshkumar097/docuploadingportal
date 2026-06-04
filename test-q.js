require('dotenv').config({ path: '.env.local' });
if (!process.env.DATABASE_URL) {
  require('dotenv').config({ path: '.env' });
}
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const md = await prisma.masterData.findMany({
    where: { 
      employeeName: { not: null }
    },
    take: 10,
    select: {
      employeeName: true,
      qualificationType: true,
      highestQualification: true
    }
  });
  console.log('Sample MD:', md);
}
main().catch(console.error).finally(() => prisma.$disconnect());
