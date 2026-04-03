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
    const records = await prisma.addressRecord.findMany();
    console.log(`Total records: ${records.length}`);
    
    const counts: Record<string, number> = {};
    const duplicateIds: string[] = [];

    records.forEach(r => {
      counts[r.employeeId] = (counts[r.employeeId] || 0) + 1;
      if (counts[r.employeeId] === 2) {
        duplicateIds.push(r.employeeId);
      }
    });

    if (duplicateIds.length > 0) {
      console.log(`Found ${duplicateIds.length} duplicate Employee IDs:`);
      for (const empId of duplicateIds) {
        const dups = records.filter(r => r.employeeId === empId);
        console.log(`ID: ${empId}`);
        dups.forEach(d => console.log(`  - ${d.id}: ${d.createdAt} (${d.fullAddress})`));
      }
    } else {
      console.log("No duplicates found.");
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(console.error);
