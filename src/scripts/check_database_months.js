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
    
    console.log('=== CANDIDATE BATCHES & MONTHS ===');
    const candRes = await pool.query(
      `SELECT phase, "trainingMonth", COUNT(*) FROM "Candidate" WHERE "clientId" = $1 GROUP BY phase, "trainingMonth" ORDER BY phase`,
      [tvsClientId]
    );
    console.table(candRes.rows);

    console.log('=== MASTER EMPLOYEE BATCHES & MONTHS ===');
    const masterRes = await pool.query(
      `SELECT phase, "trainingMonth", "uploadMonth", COUNT(*) FROM "MasterEmployee" WHERE "clientId" = $1 GROUP BY phase, "trainingMonth", "uploadMonth" ORDER BY phase`,
      [tvsClientId]
    );
    console.table(masterRes.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
