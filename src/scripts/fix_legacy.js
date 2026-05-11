const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Basic .env parser
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

async function fix() {
  try {
    console.log("Connecting to database...");
    const res = await pool.query("UPDATE \"MasterEmployee\" SET \"clientId\" = 'cmn30m1wi000404jshcme0rww' WHERE \"clientId\" IS NULL");
    console.log(`SUCCESS: Updated ${res.rowCount} records with default Client ID.`);
  } catch (err) {
    console.error("ERROR:", err.message);
  } finally {
    await pool.end();
  }
}

fix();
