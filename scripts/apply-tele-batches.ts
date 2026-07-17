import * as xlsx from 'xlsx';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  const file = 'tele batches 1 & 2.xlsx';
  console.log(`Reading Excel file: ${file}`);
  
  const workbook = xlsx.readFile(file);
  const employeeBatchMap = new Map<string, string>();

  workbook.SheetNames.forEach(sheetName => {
    // Normalise sheet name to "Batch 01" or "Batch 02"
    const normalizedBatchName = sheetName.trim();
    const worksheet = workbook.Sheets[sheetName];
    const data: any[] = xlsx.utils.sheet_to_json(worksheet);
    
    let count = 0;
    data.forEach(row => {
      const rawEmpId = row['EMP ID NO'];
      if (rawEmpId !== undefined && rawEmpId !== null) {
        const empId = String(rawEmpId).trim();
        if (empId) {
          employeeBatchMap.set(empId, normalizedBatchName);
          count++;
        }
      }
    });
    console.log(`Sheet "${sheetName}": Loaded ${count} employee records. mapped to batch: "${normalizedBatchName}"`);
  });

  const uniqueEmpIds = Array.from(employeeBatchMap.keys());
  console.log(`\nTotal unique Employee IDs to map: ${uniqueEmpIds.length}`);

  const clientId = 'cmraan786000b04l1iltz558x'; // home credit TC

  // 1. Update Candidate table
  console.log('\n--- Updating Candidate Table ---');
  let candidateUpdateCount = 0;
  for (const empId of uniqueEmpIds) {
    const batchName = employeeBatchMap.get(empId)!;
    const candidates = await prisma.candidate.findMany({
      where: {
        clientId,
        employeeId: empId
      }
    });

    for (const c of candidates) {
      if (c.phase !== batchName) {
        await prisma.candidate.update({
          where: { id: c.id },
          data: { phase: batchName }
        });
        candidateUpdateCount++;
      }
    }
  }
  console.log(`Updated ${candidateUpdateCount} Candidate records with batch names.`);

  // 2. Update MasterEmployee table
  console.log('\n--- Updating MasterEmployee Table ---');
  let masterUpdateCount = 0;
  for (const empId of uniqueEmpIds) {
    const batchName = employeeBatchMap.get(empId)!;
    const masters = await prisma.masterEmployee.findMany({
      where: {
        clientId,
        employeeId: empId
      }
    });

    for (const m of masters) {
      if (m.phase !== batchName || m.draBatch !== batchName) {
        await prisma.masterEmployee.update({
          where: { id: m.id },
          data: { 
            phase: batchName,
            draBatch: batchName
          }
        });
        masterUpdateCount++;
      }
    }
  }
  console.log(`Updated ${masterUpdateCount} MasterEmployee records with batch names.`);

  console.log('\n=== Batch mapping completed successfully ===');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
