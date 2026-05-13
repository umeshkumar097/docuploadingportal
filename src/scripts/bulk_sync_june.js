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
  const client = await pool.connect();
  try {
    console.log("Reading Excel file...");
    const workbook = XLSX.readFile('./June 2026.xlsx');
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);
    
    console.log(`Processing ${rows.length} rows...`);

    // Create temp table
    await client.query('CREATE TEMP TABLE temp_qual (emp_id TEXT, qual_type TEXT)');

    // Batch inserts into temp table
    const values = [];
    const params = [];
    let counter = 1;

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

      values.push(`($${counter}, $${counter + 1})`);
      params.push(empId, type);
      counter += 2;

      // Flush every 500 records to avoid parameter limit
      if (values.length >= 500) {
        await client.query(`INSERT INTO temp_qual (emp_id, qual_type) VALUES ${values.join(',')}`, params);
        values.length = 0;
        params.length = 0;
        counter = 1;
      }
    }

    if (values.length > 0) {
      await client.query(`INSERT INTO temp_qual (emp_id, qual_type) VALUES ${values.join(',')}`, params);
    }

    console.log("Updating MasterEmployee...");
    const res1 = await client.query(`
      UPDATE "MasterEmployee" m 
      SET "qualificationType" = t.qual_type 
      FROM temp_qual t 
      WHERE m."employeeId" = t.emp_id
    `);
    console.log(`Updated ${res1.rowCount} master records.`);

    console.log("Updating Candidate...");
    const res2 = await client.query(`
      UPDATE "Candidate" c 
      SET "qualificationType" = t.qual_type 
      FROM temp_qual t 
      WHERE c."employeeId" = t.emp_id
    `);
    console.log(`Updated ${res2.rowCount} candidate records.`);

    console.log("DONE!");

  } catch (err) {
    console.error("ERROR:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

sync();
