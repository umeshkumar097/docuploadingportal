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

async function cleanup() {
  try {
    const targetId = 'cmp42fh9x000104l28ayr4vqk';
    await pool.query('DELETE FROM "Document" WHERE "candidateId" = $1', [targetId]);
    await pool.query('DELETE FROM "Candidate" WHERE id = $1', [targetId]);
    console.log(`Successfully cleaned up duplicate candidate ${targetId}`);
  } catch (err) {
    console.error("CLEANUP ERROR:", err.message);
  } finally {
    await pool.end();
  }
}

cleanup();
