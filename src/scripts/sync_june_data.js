const { Pool } = require('pg');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '../../.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        process.env[key] = value;
      }
    });
  }
}

loadEnv();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function sync() {
  try {
    console.log("Reading Excel file...");
    const workbook = XLSX.readFile('./June 2026.xlsx');
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);
    
    console.log(`Processing ${rows.length} rows...`);
    
    let updatedMaster = 0;
    let updatedCandidates = 0;

    for (const row of rows) {
      const empId = String(row['Employee Id'] || '').trim();
      const gradStatus = String(row['Grad / Non-Grad'] || '').toUpperCase();
      
      if (!empId) continue;

      let type = "UNDERGRADUATE";
      if (gradStatus.includes("GRAD") && !gradStatus.includes("NON")) {
        type = "GRADUATE";
      } else if (gradStatus.includes("NON")) {
        type = "UNDERGRADUATE";
      } else if (gradStatus === "G") {
        type = "GRADUATE";
      }

      // Update MasterEmployee
      const res1 = await pool.query(
        "UPDATE \"MasterEmployee\" SET \"qualificationType\" = $1 WHERE \"employeeId\" = $2",
        [type, empId]
      );
      updatedMaster += res1.rowCount;

      // Update Candidate too for immediate visibility
      const res2 = await pool.query(
        "UPDATE \"Candidate\" SET \"qualificationType\" = $1 WHERE \"employeeId\" = $2",
        [type, empId]
      );
      updatedCandidates += res2.rowCount;
    }

    console.log(`SUCCESS: Updated ${updatedMaster} master records and ${updatedCandidates} candidate records.`);

  } catch (err) {
    console.error("ERROR:", err.message);
  } finally {
    await pool.end();
  }
}

sync();
