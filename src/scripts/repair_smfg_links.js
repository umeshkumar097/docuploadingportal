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

async function repair() {
  try {
    const smfgId = 'cmoy8kbe3000204kwaz26w0h9';
    console.log(`Mapping all NULL/empty clientIds to SMFG (${smfgId})...`);
    
    const res = await pool.query(
      'UPDATE "MasterEmployee" SET "clientId" = $1 WHERE "clientId" IS NULL OR "clientId" = $2', 
      [smfgId, '']
    );
    
    console.log(`SUCCESS: Fixed ${res.rowCount} records.`);

  } catch (err) {
    console.error("ERROR:", err.message);
  } finally {
    await pool.end();
  }
}

repair();
