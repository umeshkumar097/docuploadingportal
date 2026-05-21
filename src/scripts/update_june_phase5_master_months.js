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
    const targetPhase = 'June Phase 5';
    const targetMonth = 'May 2026';

    console.log(`=== Updating MasterEmployee & Candidate Months for '${targetPhase}' ===`);

    // 1. Update MasterEmployee trainingMonth where phase is 'June Phase 5'
    const masterUpdate = await pool.query(
      `UPDATE "MasterEmployee" SET "trainingMonth" = $1 WHERE "clientId" = $2 AND "phase" = $3`,
      [targetMonth, tvsClientId, targetPhase]
    );
    console.log(`Successfully updated ${masterUpdate.rowCount} MasterEmployee records to have trainingMonth = '${targetMonth}'.`);

    // 2. Update Candidate trainingMonth where phase is 'June Phase 5'
    const candidateUpdate = await pool.query(
      `UPDATE "Candidate" SET "trainingMonth" = $1 WHERE "clientId" = $2 AND "phase" = $3`,
      [targetMonth, tvsClientId, targetPhase]
    );
    console.log(`Successfully updated ${candidateUpdate.rowCount} Candidate records to have trainingMonth = '${targetMonth}'.`);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
