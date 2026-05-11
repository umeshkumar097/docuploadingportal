import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Starting data migration...");
  
  const count = await prisma.masterEmployee.updateMany({
    where: {
      clientId: {
        equals: null
      }
    },
    data: {
      clientId: "cmn30m1wi000404jshcme0rww"
    }
  });

  console.log(`Successfully updated ${count.count} records with the default Client ID.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
