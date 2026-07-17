import * as xlsx from 'xlsx';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  const file = '/Users/aiclex/Downloads/DRA Field batches 1, 2 & 3 (1) (1).xlsx';
  console.log(`Reading file: ${file}`);
  const workbook = xlsx.readFile(file);

  const targetSheets = ['Batch 01', 'Batch 02', 'Batch 03'];
  const employeeBatchMap = new Map<string, string>();

  for (const sheetName of workbook.SheetNames) {
    if (!targetSheets.includes(sheetName)) {
      console.log(`Skipping sheet: "${sheetName}"`);
      continue;
    }
    const worksheet = workbook.Sheets[sheetName];
    const data: any[] = xlsx.utils.sheet_to_json(worksheet);
    let count = 0;
    data.forEach((row: any) => {
      const rawEmpId = row['EMP ID NO'];
      if (rawEmpId !== undefined && rawEmpId !== null) {
        const empId = String(rawEmpId).trim();
        if (empId) { employeeBatchMap.set(empId, sheetName); count++; }
      }
    });
    console.log(`Sheet "${sheetName}": Loaded ${count} employee IDs`);
  }

  const uniqueEmpIds = Array.from(employeeBatchMap.keys());
  console.log(`\nTotal unique Employee IDs to map: ${uniqueEmpIds.length}`);

  // Correct home credit client ID
  const clientId = 'cmnwuixve000d04jv2xz5iq0h';

  console.log('\n--- Updating Candidate Table ---');
  let candidateUpdateCount = 0;
  for (const empId of uniqueEmpIds) {
    const batchName = employeeBatchMap.get(empId)!;
    const found = await prisma.candidate.findMany({ where: { clientId, employeeId: empId } });
    for (const c of found) {
      if (c.phase !== batchName) {
        await prisma.candidate.update({ where: { id: c.id }, data: { phase: batchName } });
        candidateUpdateCount++;
      }
    }
  }
  console.log(`Updated ${candidateUpdateCount} Candidate records.`);

  console.log('\n--- Updating MasterEmployee Table ---');
  let masterUpdateCount = 0;
  for (const empId of uniqueEmpIds) {
    const batchName = employeeBatchMap.get(empId)!;
    const found = await prisma.masterEmployee.findMany({ where: { clientId, employeeId: empId } });
    for (const m of found) {
      if (m.phase !== batchName || m.draBatch !== batchName) {
        await prisma.masterEmployee.update({ where: { id: m.id }, data: { phase: batchName, draBatch: batchName } });
        masterUpdateCount++;
      }
    }
  }
  console.log(`Updated ${masterUpdateCount} MasterEmployee records.`);

  console.log('\n=== DRA Batch mapping completed successfully ===');
}

run().catch(console.error).finally(() => prisma.$disconnect());
