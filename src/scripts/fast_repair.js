const { Pool } = require('pg');
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

async function main() {
  try {
    console.log("Starting FAST category repair...");
    
    // 1. Sync from MasterEmployee where possible
    const res1 = await pool.query(`
      UPDATE "Candidate" c 
      SET "qualificationType" = m."qualificationType" 
      FROM "MasterEmployee" m 
      WHERE (c."employeeId" = m."employeeId" OR c."mobileNumber" = m."personalMobileNo") 
      AND c."qualificationType" IS NULL 
      AND m."qualificationType" IS NOT NULL
    `);
    console.log(`Synced ${res1.rowCount} candidates from master data.`);

    // 2. Default for TVS candidates
    const res2 = await pool.query(`
      UPDATE "Candidate" 
      SET "qualificationType" = 'GRADUATE' 
      WHERE "qualificationType" IS NULL 
      AND ("employer" ILIKE '%TVS%' OR "clientId" = 'cmn30m1wi000404jshcme0rww')
    `);
    console.log(`Set default GRADUATE for ${res2.rowCount} legacy TVS candidates.`);

    // 3. Default for TVS master records
    const res3 = await pool.query(`
      UPDATE "MasterEmployee" 
      SET "qualificationType" = 'GRADUATE' 
      WHERE "qualificationType" IS NULL 
      AND "clientId" = 'cmn30m1wi000404jshcme0rww'
    `);
    console.log(`Set default GRADUATE for ${res3.rowCount} TVS master records.`);

  } catch (err) {
    console.error("ERROR:", err.message);
  } finally {
    await pool.end();
  }
}

main();
