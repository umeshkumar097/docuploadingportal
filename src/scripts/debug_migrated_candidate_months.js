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

async function run() {
  try {
    const tvsClientId = 'cmn30m1wi000404jshcme0rww';
    const res = await pool.query(
      `SELECT id, name, "employeeId", phase, "trainingMonth" FROM "Candidate" WHERE "clientId" = $1 AND phase = 'June Phase 5' LIMIT 10`,
      [tvsClientId]
    );
    console.log('Sample June Phase 5 candidates:');
    console.table(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
