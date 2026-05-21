const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
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

async function migrate() {
  try {
    const tvsClientId = 'cmn30m1wi000404jshcme0rww';
    const targetPhase = 'June Phase 5';

    // 1. Get all MasterEmployees for TVS Credit in June Phase 5
    const phase5Res = await pool.query(
      `SELECT * FROM "MasterEmployee" WHERE "clientId" = $1 AND "phase" = $2`,
      [tvsClientId, targetPhase]
    );
    const phase5Employees = phase5Res.rows;
    console.log(`Found ${phase5Employees.length} employees in June Phase 5 master data.`);

    // 2. Get all completed candidates in previous phases (Phase 1, 2, 3, 4, and null/legacy)
    const prevCandidatesRes = await pool.query(
      `SELECT * FROM "Candidate" WHERE "clientId" = $1 AND ("phase" IS NULL OR "phase" != $2) AND "status" IN ('READY', 'OPS_VERIFIED', 'VALIDATED')`,
      [tvsClientId, targetPhase]
    );
    const prevCandidates = prevCandidatesRes.rows;
    console.log(`Found ${prevCandidates.length} completed candidates in previous phases.`);

    // 3. Create index for matching
    const prevByEmpId = new Map();
    const prevByMobile = new Map();

    for (const c of prevCandidates) {
      if (c.employeeId) {
        prevByEmpId.set(c.employeeId.toLowerCase().trim(), c);
      }
      if (c.mobileNumber) {
        prevByMobile.set(c.mobileNumber.trim(), c);
      }
    }

    // 4. Match and collect candidates to update
    const candidatesToUpdate = [];
    
    for (const emp of phase5Employees) {
      const empId = emp.employeeId ? emp.employeeId.toLowerCase().trim() : null;
      const mobiles = [
        emp.personalMobileNo,
        emp.whatsappNo,
        emp.officeMobileNo
      ].filter(Boolean).map(m => m.trim());

      let matchedCandidate = null;
      let matchMethod = '';

      if (empId && prevByEmpId.has(empId)) {
        matchedCandidate = prevByEmpId.get(empId);
        matchMethod = `Employee ID Match (${emp.employeeId})`;
      } else {
        for (const mob of mobiles) {
          if (prevByMobile.has(mob)) {
            matchedCandidate = prevByMobile.get(mob);
            matchMethod = `Mobile Match (${mob})`;
            break;
          }
        }
      }

      if (matchedCandidate) {
        candidatesToUpdate.push({
          candidateId: matchedCandidate.id,
          employeeId: emp.employeeId,
          name: emp.employeeName || matchedCandidate.name,
          originalPhase: matchedCandidate.phase || 'Legacy (null)',
          originalStatus: matchedCandidate.status,
          matchMethod
        });
      }
    }

    console.log(`Found ${candidatesToUpdate.length} candidates eligible to be updated to '${targetPhase}'.`);

    if (candidatesToUpdate.length === 0) {
      console.log('No candidates to update.');
      return;
    }

    // 5. Perform Database Updates
    console.log('\n=== Executing Migration Updates ===');
    let successCount = 0;
    
    for (const entry of candidatesToUpdate) {
      try {
        const updateRes = await pool.query(
          `UPDATE "Candidate" SET "phase" = $1 WHERE "id" = $2 RETURNING id, name, "employeeId", phase`,
          [targetPhase, entry.candidateId]
        );
        
        if (updateRes.rowCount > 0) {
          const row = updateRes.rows[0];
          successCount++;
          console.log(`[SUCCESS ${successCount}/${candidatesToUpdate.length}] Migrated Candidate: ID=${row.id}, EmpId=${row.employeeId}, Name='${row.name}', Old Phase='${entry.originalPhase}' => New Phase='${row.phase}'`);
        } else {
          console.log(`[FAILED] Candidate not found for update: ID=${entry.candidateId}`);
        }
      } catch (updateErr) {
        console.error(`[ERROR] Failed to update candidate ID=${entry.candidateId}:`, updateErr.message);
      }
    }

    console.log(`\n=== Migration Completed ===`);
    console.log(`Successfully migrated ${successCount} out of ${candidatesToUpdate.length} candidates to '${targetPhase}'.`);

  } catch (err) {
    console.error('Error running migration script:', err);
  } finally {
    await pool.end();
  }
}

migrate();
