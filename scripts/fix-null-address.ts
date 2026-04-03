import PrismaClientModule from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const url = process.env.DATABASE_URL?.replace(/^["']/, "").replace(/["']$/, "");
  if (!url) throw new Error("DATABASE_URL not found");

  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  
  // @ts-ignore
  const { PrismaClient } = PrismaClientModule;
  const prisma = new PrismaClient({ adapter });

  try {
    const records = await prisma.addressRecord.findMany({
      where: {
        addressLine1: null
      }
    });

    console.log(`Fixing ${records.length} records with NULL addressLine1...`);

    for (const record of records) {
      await prisma.addressRecord.update({
        where: { id: record.id },
        data: {
          addressLine1: 'N/A'
        }
      });
    }

    console.log("Fix complete.");
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(console.error);
