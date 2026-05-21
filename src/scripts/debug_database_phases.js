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

async function debugPhases() {
  try {
    const tvsClientId = 'cmn30m1wi000404jshcme0rww';

    // 1. Count of MasterEmployees per phase for TVS Credit
    console.log("=== MasterEmployee counts by Phase for TVS ===");
    const masterPhases = await pool.query(
      `SELECT phase, COUNT(*), "uploadMonth" FROM "MasterEmployee" WHERE "clientId" = $1 GROUP BY phase, "uploadMonth" ORDER BY phase`,
      [tvsClientId]
    );
    console.table(masterPhases.rows);

    // 2. Count of Candidates per phase for TVS Credit
    console.log("\n=== Candidate counts by Phase and Status for TVS ===");
    const candidatePhases = await pool.query(
      `SELECT phase, status, COUNT(*) FROM "Candidate" WHERE "clientId" = $1 GROUP BY phase, status ORDER BY phase`,
      [tvsClientId]
    );
    console.table(candidatePhases.rows);

    // 3. Count of Candidates with completed/existing uploads matching June Phase 5 by employeeId
    console.log("\n=== Checking June Phase 5 Master employees against other phases in Candidate table ===");
    // Get June Phase 5 employees
    const p5EmpRes = await pool.query(
      `SELECT "employeeId", "employeeName", "personalMobileNo" FROM "MasterEmployee" WHERE "clientId" = $1 AND phase = 'June Phase 5'`,
      [tvsClientId]
    );
    const p5Emps = p5EmpRes.rows;
    console.log(`June Phase 5 Master employees: ${p5Emps.length}`);

    // Get all completed Candidates in phases other than June Phase 5
    const otherCandidatesRes = await pool.query(
      `SELECT id, "employeeId", name, "mobileNumber", status, phase FROM "Candidate" WHERE "clientId" = $1 AND phase != 'June Phase 5' AND status IN ('READY', 'OPS_VERIFIED', 'VALIDATED')`,
      [tvsClientId]
    );
    const otherCandidates = otherCandidatesRes.rows;
    console.log(`Completed Candidates in other phases: ${otherCandidates.length}`);

    // Match them
    const matchesEmpId = [];
    const matchesMobile = [];

    const otherByEmpId = new Map();
    const otherByMobile = new Map();

    for (const c of otherCandidates) {
      if (c.employeeId) otherByEmpId.set(c.employeeId.toLowerCase().trim(), c);
      if (c.mobileNumber) otherByMobile.set(c.mobileNumber.trim(), c);
    }

    for (const emp of p5Emps) {
      const empId = emp.employeeId ? emp.employeeId.toLowerCase().trim() : null;
      const mobile = emp.personalMobileNo ? emp.personalMobileNo.trim() : null;

      if (empId && otherByEmpId.has(empId)) {
        matchesEmpId.push({
          phase5EmpId: emp.employeeId,
          phase5Name: emp.employeeName,
          matchedCandidateId: otherByEmpId.get(empId).employeeId,
          matchedName: otherByEmpId.get(empId).name,
          matchedPhase: otherByEmpId.get(empId).phase,
          matchedStatus: otherByEmpId.get(empId).status
        });
      } else if (mobile && otherByMobile.has(mobile)) {
        matchesMobile.push({
          phase5EmpId: emp.employeeId,
          phase5Name: emp.employeeName,
          phase5Mobile: emp.personalMobileNo,
          matchedCandidateId: otherByMobile.get(mobile).employeeId,
          matchedName: otherByMobile.get(mobile).name,
          matchedMobile: otherByMobile.get(mobile).mobileNumber,
          matchedPhase: otherByMobile.get(mobile).phase,
          matchedStatus: otherByMobile.get(mobile).status
        });
      }
    }

    console.log(`Matches by Employee ID: ${matchesEmpId.length}`);
    console.log(`Matches by Mobile (not matching Emp ID): ${matchesMobile.length}`);

    console.log("\nSample Employee ID Matches:");
    console.table(matchesEmpId.slice(0, 15));

    console.log("\nSample Mobile Matches:");
    console.table(matchesMobile.slice(0, 15));

  } catch (err) {
    console.error("Error debugging database phases:", err);
  } finally {
    await pool.end();
  }
}

debugPhases();
