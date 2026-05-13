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

async function check() {
  try {
    const clientId = 'cmoy8kbe3000204kwaz26w0h9';
    const res = await pool.query('SELECT count(*) FROM "MasterEmployee" WHERE "clientId" = $1', [clientId]);
    console.log(`Master Data Count for SMFG (${clientId}):`, res.rows[0].count);

    if (res.rows[0].count == 0) {
      console.log("WARNING: No data found for this client ID!");
      // Check if EMP102 exists anywhere else
      const res2 = await pool.query('SELECT "clientId", "employeeName" FROM "MasterEmployee" WHERE "employeeId" = $1', ['EMP102']);
      console.log("EMP102 found in other clients:", res2.rows);
    } else {
        const res3 = await pool.query('SELECT * FROM "MasterEmployee" WHERE "clientId" = $1 AND "employeeId" = $2', [clientId, 'EMP102']);
        console.log("EMP102 specifically in SMFG:", res3.rows);
    }

  } catch (err) {
    console.error("ERROR:", err.message);
  } finally {
    await pool.end();
  }
}

check();
