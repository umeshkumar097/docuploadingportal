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
    console.log("Checking last 10 master records...");
    const res = await pool.query('SELECT "employeeId", "employeeName", "clientId", "uploadMonth", "createdAt" FROM "MasterEmployee" ORDER BY "createdAt" DESC LIMIT 10');
    console.table(res.rows);

    const smfgId = 'cmoy8kbe3000204kwaz26w0h9';
    const res2 = await pool.query('SELECT count(*) FROM "MasterEmployee" WHERE "clientId" = $1', [smfgId]);
    console.log(`\nTotal records for SMFG (${smfgId}):`, res2.rows[0].count);

  } catch (err) {
    console.error("ERROR:", err.message);
  } finally {
    await pool.end();
  }
}

check();
