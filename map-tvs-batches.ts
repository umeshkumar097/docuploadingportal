import * as xlsx from 'xlsx';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  const file = 'DRA AUGUST data.xlsx';
  const workbook = xlsx.readFile(file);
  const ws = workbook.Sheets['Data'];
  const data: any[] = xlsx.utils.sheet_to_json(ws);

  // Build map: employeeId -> batch name (column D = "Batch Number")
  const empBatchMap = new Map<string, string>();
  data.forEach((row: any) => {
    const empId = String(row['Employee Id'] || '').trim();
    const batch = String(row['Batch Number'] || '').trim();
    if (empId && batch) empBatchMap.set(empId, batch);
  });

  console.log(`Total Excel records: ${data.length}`);
  console.log(`Mapped IDs: ${empBatchMap.size}`);

  // TVS Credit client ID
  const clientId = 'cmn30m1wi000404jshcme0rww';

  const uniqueEmpIds = Array.from(empBatchMap.keys());

  // Check which ones exist in Candidate table (submitted - READY status)
  const dbCandidates = await prisma.candidate.findMany({
    where: { clientId, employeeId: { in: uniqueEmpIds }, status: 'READY' }
  });
  const foundIds = new Set(dbCandidates.map(c => c.employeeId!));
  const notFoundIds = uniqueEmpIds.filter(id => !foundIds.has(id));

  console.log(`\nFound in TVS Submitted (READY): ${foundIds.size}`);
  console.log(`NOT found in TVS Submitted: ${notFoundIds.length}`);
  console.log("Not Found IDs:", notFoundIds);

  // Update phase for matched candidates
  console.log('\n--- Updating Candidate phase (batch) ---');
  let updated = 0;
  for (const c of dbCandidates) {
    const batch = empBatchMap.get(c.employeeId!)!;
    if (c.phase !== batch) {
      await prisma.candidate.update({ where: { id: c.id }, data: { phase: batch } });
      updated++;
    }
  }
  console.log(`Updated ${updated} Candidate records.`);

  // Update MasterEmployee phase
  console.log('\n--- Updating MasterEmployee phase (batch) ---');
  const dbMasters = await prisma.masterEmployee.findMany({
    where: { clientId, employeeId: { in: uniqueEmpIds } }
  });
  let masterUpdated = 0;
  for (const m of dbMasters) {
    const batch = empBatchMap.get(m.employeeId!)!;
    if (m.phase !== batch || m.draBatch !== batch) {
      await prisma.masterEmployee.update({ where: { id: m.id }, data: { phase: batch, draBatch: batch } });
      masterUpdated++;
    }
  }
  console.log(`Updated ${masterUpdated} MasterEmployee records.`);

  // Print not found details from Excel
  if (notFoundIds.length > 0) {
    console.log('\n=== CANDIDATES NOT FOUND IN TVS SUBMITTED ===');
    notFoundIds.forEach(id => {
      const row = data.find((r: any) => String(r['Employee Id']) === id);
      console.log(`ID: ${id} | Name: ${row?.['Employee Name']} | Batch: ${empBatchMap.get(id)}`);
    });
  }

  console.log('\n=== Done ===');
}

run().catch(console.error).finally(() => prisma.$disconnect());
