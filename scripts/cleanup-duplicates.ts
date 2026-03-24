import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
// @ts-ignore - Node 21.7+ feature
if (typeof (process as any).loadEnvFile === "function") {
  (process as any).loadEnvFile(".env");
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const pool = new Pool({ connectionString: url });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting manual deduplication cleanup...");

  // 1. Get all candidates
  const candidates = await prisma.candidate.findMany({
    include: {
      _count: { select: { documents: true } }
    }
  });

  // 2. Group by identity (EmployeeId or MobileNumber)
  const groups = new Map<string, any[]>();
  
  for (const c of candidates) {
    const key = c.employeeId || c.mobileNumber;
    if (!key) continue;
    
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(c);
  }

  let deletedCount = 0;

  // 3. Process groups with duplicates
  for (const [key, list] of groups.entries()) {
    if (list.length <= 1) continue;

    console.log(`\nFound ${list.length} records for identity: ${key}`);
    
    // Sort by: Status (priority non-PENDING), then DocCount (desc), then Age (desc)
    const sorted = [...list].sort((a, b) => {
      // Priority 1: Status not PENDING
      const aDone = a.status !== "PENDING" ? 1 : 0;
      const bDone = b.status !== "PENDING" ? 1 : 0;
      if (aDone !== bDone) return bDone - aDone;

      // Priority 2: Doc count
      const aDocs = a._count.documents;
      const bDocs = b._count.documents;
      if (aDocs !== bDocs) return bDocs - aDocs;

      // Priority 3: Most recent
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const keep = sorted[0];
    const toDelete = sorted.slice(1);

    console.log(`KEEPPING: ID=${keep.id}, Status=${keep.status}, Docs=${keep._count.documents}`);
    
    for (const c of toDelete) {
      console.log(`DELETING: ID=${c.id}, Status=${c.status}, Docs=${c._count.documents}`);
      
      // Delete documents first (cascade might not be on)
      await prisma.document.deleteMany({ where: { candidateId: c.id } });
      await prisma.candidate.delete({ where: { id: c.id } });
      deletedCount++;
    }
  }

  console.log(`\nCleanup finished. Total records removed: ${deletedCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
