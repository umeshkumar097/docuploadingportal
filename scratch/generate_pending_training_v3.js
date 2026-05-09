const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const XLSX = require('xlsx');
require('dotenv').config();

async function main() {
  const url = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Read Excel file
    const workbook = XLSX.readFile('TVS DRA April & MAY 2026 Attendance sheet.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const excelData = XLSX.utils.sheet_to_json(worksheet);
    
    const trainedEmpIds = new Set(excelData.map(row => String(row['Employee Id']).trim().toUpperCase()).filter(id => id && id !== 'UNDEFINED' && id !== 'NULL'));
    console.log(`Found ${trainedEmpIds.size} unique trained employees in Excel.`);

    // 2. Fetch candidates with documents from DB
    const candidates = await prisma.candidate.findMany({
      where: {
        documents: {
          some: {}
        }
      },
      select: {
        employeeId: true
      }
    });

    console.log(`Found ${candidates.length} candidates with documents in DB.`);

    // 3. Filter candidates not in Excel
    const pendingIds = candidates
      .map(c => c.employeeId?.trim().toUpperCase())
      .filter(id => id && !trainedEmpIds.has(id));

    const uniquePendingIds = Array.from(new Set(pendingIds));
    console.log(`Found ${uniquePendingIds.length} unique Employee IDs needing training.`);

    // 4. Fetch Master Data for these IDs
    const masterRecords = await prisma.masterEmployee.findMany({
      where: {
        employeeId: { in: uniquePendingIds }
      }
    });

    // 5. Deduplicate Master Records by Employee ID
    // We take the most recent record for each ID
    const deduplicatedMap = new Map();
    masterRecords.forEach(m => {
      const existing = deduplicatedMap.get(m.employeeId);
      if (!existing || m.createdAt > existing.createdAt) {
        deduplicatedMap.set(m.employeeId, m);
      }
    });
    
    const finalRecords = Array.from(deduplicatedMap.values());
    console.log(`Deduplicated to ${finalRecords.length} records.`);

    // 6. Prepare data for export
    const exportData = finalRecords.map(m => ({
      'Employee ID': m.employeeId,
      'Employee Name': m.employeeName,
      'WhatsApp Number': m.whatsappNo,
      'Personal Mobile': m.personalMobileNo,
      'Office Mobile': m.officeMobileNo,
      'Vendor': m.vendor,
      'State': m.state,
      'City': m.city,
      'Phase': m.phase,
      'Training Month': m.trainingMonth
    }));

    // 7. Create new Excel file
    const newWorksheet = XLSX.utils.json_to_sheet(exportData);
    const newWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, "Pending Training");
    
    // Set column widths
    newWorksheet['!cols'] = [
      { wch: 15 }, // Emp ID
      { wch: 25 }, // Name
      { wch: 15 }, // WhatsApp
      { wch: 15 }, // Personal Mobile
      { wch: 15 }, // Office Mobile
      { wch: 20 }, // Vendor
      { wch: 15 }, // State
      { wch: 15 }, // City
      { wch: 10 }, // Phase
      { wch: 15 }, // Month
    ];

    const filename = `Pending_Training_Final_List_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(newWorkbook, filename);
    
    console.log(`Exported to ${filename} with ${exportData.length} unique records.`);

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
