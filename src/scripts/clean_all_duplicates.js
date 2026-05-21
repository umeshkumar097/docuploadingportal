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

async function cleanAllDuplicates() {
  try {
    console.log("Starting duplicate cleanup process...");
    
    // 1. Find all employeeIds with duplicates
    const res = await pool.query(`
      SELECT "employeeId", COUNT(*) as count 
      FROM "Candidate" 
      WHERE "employeeId" IS NOT NULL AND "employeeId" != '' AND "employeeId" != 'NONE_ID'
      GROUP BY "employeeId" 
      HAVING COUNT(*) > 1
    `);
    
    const duplicateGroups = res.rows;
    console.log(`Found ${duplicateGroups.length} employees with duplicate records.`);
    
    let totalDeletedCandidates = 0;

    // 2. Process each employeeId
    for (const group of duplicateGroups) {
        const employeeId = group.employeeId;
        
        // Get all candidates for this employeeId, sorted by newest first
        const candidatesRes = await pool.query(`
            SELECT id, "createdAt"
            FROM "Candidate"
            WHERE "employeeId" = $1
            ORDER BY "createdAt" DESC
        `, [employeeId]);
        
        const candidates = candidatesRes.rows;
        
        // Keep the first one (latest), delete the rest
        const latestCandidate = candidates[0];
        const candidatesToDelete = candidates.slice(1);
        
        for (const candidateToDelete of candidatesToDelete) {
            const targetId = candidateToDelete.id;
            
            // Delete associated documents first to satisfy foreign key constraints
            await pool.query('DELETE FROM "Document" WHERE "candidateId" = $1', [targetId]);
            
            // Delete the candidate
            await pool.query('DELETE FROM "Candidate" WHERE id = $1', [targetId]);
            
            totalDeletedCandidates++;
            console.log(`Deleted duplicate candidate ${targetId} for employee ${employeeId}`);
        }
    }

    console.log(`\nCleanup complete! Deleted ${totalDeletedCandidates} duplicate candidate records.`);

  } catch (err) {
    console.error("CLEANUP ERROR:", err.message);
  } finally {
    await pool.end();
  }
}

cleanAllDuplicates();
