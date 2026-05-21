const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

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

async function run() {
  try {
    // 1. Get all MasterEmployee records for TVS Credit in June Phase 5
    const tvsClientId = 'cmn30m1wi000404jshcme0rww';
    const phase5Res = await pool.query(
      `SELECT * FROM "MasterEmployee" WHERE "clientId" = $1 AND "phase" = 'June Phase 5'`,
      [tvsClientId]
    );
    const phase5Employees = phase5Res.rows;
    console.log(`Found ${phase5Employees.length} employees in June Phase 5 for TVS Credit.`);

    // 2. Get all READY/OPS_VERIFIED/VALIDATED candidates for TVS Credit
    const completedCandidatesRes = await pool.query(
      `SELECT * FROM "Candidate" WHERE "clientId" = $1 AND "status" IN ('READY', 'OPS_VERIFIED', 'VALIDATED')`,
      [tvsClientId]
    );
    const completedCandidates = completedCandidatesRes.rows;
    console.log(`Found ${completedCandidates.length} completed candidates overall for TVS Credit.`);

    // 3. Match them to see who in Phase 5 already has completed candidate records
    const compByEmpId = new Map();
    const compByMobile = new Map();
    
    for (const c of completedCandidates) {
      if (c.employeeId) compByEmpId.set(c.employeeId.toLowerCase().trim(), c);
      if (c.mobileNumber) compByMobile.set(c.mobileNumber.trim(), c);
    }

    const matches = [];
    for (const emp of phase5Employees) {
      const empId = emp.employeeId ? emp.employeeId.toLowerCase().trim() : null;
      const mobiles = [
        emp.personalMobileNo,
        emp.whatsappNo,
        emp.officeMobileNo
      ].filter(Boolean).map(m => m.trim());

      let matchedCandidate = null;
      let matchReason = '';

      if (empId && compByEmpId.has(empId)) {
        matchedCandidate = compByEmpId.get(empId);
        matchReason = `Matched by Employee ID (${emp.employeeId})`;
      } else {
        for (const mob of mobiles) {
          if (compByMobile.has(mob)) {
            matchedCandidate = compByMobile.get(mob);
            matchReason = `Matched by Mobile Number (${mob})`;
            break;
          }
        }
      }

      if (matchedCandidate) {
        matches.push({
          'Employee ID': emp.employeeId || 'N/A',
          'Employee Name': emp.employeeName || 'N/A',
          'Phase 5 Mobile': emp.personalMobileNo || emp.whatsappNo || emp.officeMobileNo || 'N/A',
          'Role/Designation': emp.reportingManagerGroup || 'N/A',
          'Status in DB': matchedCandidate.status,
          'Existing Candidate Name': matchedCandidate.name || 'N/A',
          'Existing Candidate Mobile': matchedCandidate.mobileNumber || 'N/A',
          'Match Reason': matchReason,
          'Submitted Date': matchedCandidate.createdAt ? new Date(matchedCandidate.createdAt).toLocaleDateString() : 'N/A'
        });
      }
    }

    console.log(`Found ${matches.length} matches who have already uploaded documents.`);

    if (matches.length > 0) {
      // 4. Create an Excel sheet
      const ws = xlsx.utils.json_to_sheet(matches);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, 'Already Uploaded');
      
      const outputPath = path.join(__dirname, '../../TVS_Phase5_Already_Uploaded.xlsx');
      xlsx.writeFile(wb, outputPath);
      console.log(`Excel file written successfully to ${outputPath}`);
    } else {
      console.log('No matches found. No Excel file created.');
    }

  } catch (err) {
    console.error('Error running script:', err);
  } finally {
    await pool.end();
  }
}

run();
