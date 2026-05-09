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
    
    const trainedEmpIds = new Set(excelData.map(row => String(row['Employee Id']).trim().toUpperCase()).filter(id => id && id !== 'UNDEFINED'));
    console.log(`Found ${trainedEmpIds.size} trained employees in Excel.`);

    // 2. Fetch candidates with documents from DB
    // We look for candidates who have at least one document
    const candidates = await prisma.candidate.findMany({
      where: {
        documents: {
          some: {}
        }
      },
      include: {
        _count: {
          select: { documents: true }
        }
      }
    });

    console.log(`Found ${candidates.length} candidates with documents in DB.`);

    // 3. Filter candidates not in Excel
    const pendingTraining = candidates.filter(c => {
      if (!c.employeeId) return false;
      const empId = c.employeeId.trim().toUpperCase();
      return !trainedEmpIds.has(empId);
    });

    console.log(`Found ${pendingTraining.length} candidates needing training.`);

    // 4. Prepare data for export
    const exportData = pendingTraining.map(c => ({
      'Employee ID': c.employeeId,
      'Candidate Name': c.name,
      'Mobile Number': c.mobileNumber,
      'Status': c.status,
      'Documents Uploaded': c._count.documents,
      'Created At': c.createdAt
    }));

    // 5. Create new Excel file
    const newWorksheet = XLSX.utils.json_to_sheet(exportData);
    const newWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, "Pending Training");
    
    const filename = `Pending_Training_List_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(newWorkbook, filename);
    
    console.log(`Exported to ${filename}`);

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
