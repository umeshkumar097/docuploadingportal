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
    const kishore = await pool.query(`
      SELECT id, status, "createdAt", "highestQualification", "clientId", employer 
      FROM "Candidate" 
      WHERE "employeeId" = '250394' 
      ORDER BY "createdAt" DESC
    `);
    
    const rongali = await pool.query(`
      SELECT id, status, "createdAt", "highestQualification", "clientId", employer 
      FROM "Candidate" 
      WHERE "employeeId" = '240433' 
      ORDER BY "createdAt" DESC
    `);

    console.log('KISHORE R (250394):');
    console.log(kishore.rows);
    
    console.log('\nRONGALI (240433):');
    console.log(rongali.rows);
  } catch (err) {
    console.error("PG ERROR:", err.message);
  } finally {
    await pool.end();
  }
}

check();
