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

async function find() {
  try {
    const res = await pool.query(`
      SELECT "employeeId", COUNT(*) as count 
      FROM "Candidate" 
      WHERE "employeeId" IS NOT NULL 
      GROUP BY "employeeId" 
      HAVING COUNT(*) > 1
    `);
    console.log('Duplicate Employee IDs Found:');
    console.log(res.rows);
    
    for (const row of res.rows) {
        const details = await pool.query(`
            SELECT id, status, "createdAt", "highestQualification", "clientId"
            FROM "Candidate"
            WHERE "employeeId" = $1
            ORDER BY "createdAt" DESC
        `, [row.employeeId]);
        console.log(`\nDetails for ${row.employeeId}:`);
        console.log(details.rows);
    }

  } catch (err) {
    console.error("PG ERROR:", err.message);
  } finally {
    await pool.end();
  }
}

find();
