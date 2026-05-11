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

async function repair() {
  try {
    console.log("Connecting to database for category repair...");
    
    // 1. Get all candidates with missing qualificationType
    const candidatesRes = await pool.query("SELECT id, \"employeeId\", \"mobileNumber\", employer FROM \"Candidate\" WHERE \"qualificationType\" IS NULL");
    console.log(`Found ${candidatesRes.rowCount} candidates with missing category.`);

    let updatedCount = 0;

    for (const c of candidatesRes.rows) {
      // 2. Try to find matching master data
      const masterRes = await pool.query(
        "SELECT \"qualificationType\" FROM \"MasterEmployee\" WHERE (\"employeeId\" = $1 OR \"personalMobileNo\" = $2) AND \"qualificationType\" IS NOT NULL LIMIT 1",
        [c.employeeId, c.mobileNumber]
      );

      let typeToSet = null;

      if (masterRes.rowCount > 0) {
        typeToSet = masterRes.rows[0].qualificationType;
      } else {
        // Fallback: If it's TVS Credit, it's likely GRADUATE (common pattern in this project)
        if (c.employer && c.employer.toUpperCase().includes("TVS")) {
          typeToSet = "GRADUATE";
        }
      }

      if (typeToSet) {
        await pool.query("UPDATE \"Candidate\" SET \"qualificationType\" = $1 WHERE id = $2", [typeToSet, c.id]);
        updatedCount++;
      }
    }

    console.log(`SUCCESS: Repaired ${updatedCount} candidate records.`);
    
    // 3. Also update MasterEmployee records that are still NULL for TVS
    const masterUpdate = await pool.query(
      "UPDATE \"MasterEmployee\" SET \"qualificationType\" = 'GRADUATE' WHERE \"qualificationType\" IS NULL AND \"clientId\" = 'cmn30m1wi000404jshcme0rww'"
    );
    console.log(`Updated ${masterUpdate.rowCount} MasterEmployee records to default 'GRADUATE' for TVS Credit.`);

  } catch (err) {
    console.error("ERROR:", err.message);
  } finally {
    await pool.end();
  }
}

repair();
