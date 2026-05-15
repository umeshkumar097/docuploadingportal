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
    const res = await pool.query(`
      SELECT 
        c.id, 
        c.token, 
        c.status, 
        c."clientId", 
        c."createdAt", 
        COUNT(d.id) as doc_count 
      FROM "Candidate" c 
      LEFT JOIN "Document" d ON c.id = d."candidateId" 
      WHERE c."employeeId" = '6064630' 
      GROUP BY c.id 
      ORDER BY c."createdAt" DESC
    `);
    console.log('Candidates for 6064630:');
    console.log(res.rows);
  } catch (err) {
    console.error("PG ERROR:", err.message);
  } finally {
    await pool.end();
  }
}

check();
