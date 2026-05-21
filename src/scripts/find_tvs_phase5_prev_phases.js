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

async function generateReport() {
  try {
    const tvsClientId = 'cmn30m1wi000404jshcme0rww';

    // 1. Get all MasterEmployees for TVS Credit in June Phase 5
    const phase5Res = await pool.query(
      `SELECT * FROM "MasterEmployee" WHERE "clientId" = $1 AND "phase" = 'June Phase 5'`,
      [tvsClientId]
    );
    const phase5Employees = phase5Res.rows;
    console.log(`Found ${phase5Employees.length} employees in June Phase 5 master data.`);

    // 2. Get all completed candidates in previous phases (Phase 1, 2, 3, 4, and null/legacy)
    const prevCandidatesRes = await pool.query(
      `SELECT * FROM "Candidate" WHERE "clientId" = $1 AND ("phase" IS NULL OR "phase" != 'June Phase 5') AND "status" IN ('READY', 'OPS_VERIFIED', 'VALIDATED')`,
      [tvsClientId]
    );
    const prevCandidates = prevCandidatesRes.rows;
    console.log(`Found ${prevCandidates.length} completed candidates in previous phases (Phases 1-4).`);

    // 3. Create index for fast matching
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

    // 4. Perform match and build records
    const reportData = [];
    let matchIndex = 1;

    for (const emp of phase5Employees) {
      const empId = emp.employeeId ? emp.employeeId.toLowerCase().trim() : null;
      const mobiles = [
        emp.personalMobileNo,
        emp.whatsappNo,
        emp.officeMobileNo
      ].filter(Boolean).map(m => m.trim());

      let matchedCandidate = null;
      let matchReason = '';

      // Match by employeeId first (strongest match)
      if (empId && prevByEmpId.has(empId)) {
        matchedCandidate = prevByEmpId.get(empId);
        matchReason = `Employee ID Match (${emp.employeeId})`;
      } 
      // Match by mobile number if employeeId match not found
      else {
        for (const mob of mobiles) {
          if (prevByMobile.has(mob)) {
            matchedCandidate = prevByMobile.get(mob);
            matchReason = `Mobile Match (${mob})`;
            break;
          }
        }
      }

      if (matchedCandidate) {
        // Find if they have documents in DB
        const docsCountRes = await pool.query(
          `SELECT COUNT(*) FROM "Document" WHERE "candidateId" = $1 AND "status" != 'REJECTED'`,
          [matchedCandidate.id]
        );
        const docsCount = docsCountRes.rows[0].count;

        reportData.push({
          'S.No': matchIndex++,
          'Employee ID': emp.employeeId || 'N/A',
          'Employee Name': emp.employeeName || 'N/A',
          'Mobile (June Phase 5)': emp.personalMobileNo || emp.whatsappNo || emp.officeMobileNo || 'N/A',
          'Highest Qualification': emp.highestQualification || 'N/A',
          'Reporting Manager': emp.reportingManagerName || 'N/A',
          'Original Upload Phase': matchedCandidate.phase || 'Phase 1/2/3/4 (Legacy)',
          'Uploaded Status': matchedCandidate.status,
          'Active in DB': emp.activeStatus || 'N/A',
          'Documents Count': parseInt(docsCount),
          'Submission Date': matchedCandidate.createdAt ? new Date(matchedCandidate.createdAt).toLocaleDateString() : 'N/A',
          'Match Method': matchReason
        });
      }
    }

    console.log(`Successfully identified ${reportData.length} employees who already uploaded documents in previous phases.`);

    // 5. Generate Excel spreadsheet
    if (reportData.length > 0) {
      const ws = xlsx.utils.json_to_sheet(reportData);

      // Set column widths for beautiful readability
      const wscols = [
        { wch: 6 },  // S.No
        { wch: 15 }, // Employee ID
        { wch: 25 }, // Employee Name
        { wch: 20 }, // Mobile
        { wch: 22 }, // Highest Qualification
        { wch: 25 }, // Reporting Manager
        { wch: 25 }, // Original Upload Phase
        { wch: 15 }, // Uploaded Status
        { wch: 15 }, // Active Status
        { wch: 15 }, // Documents Count
        { wch: 18 }, // Submission Date
        { wch: 30 }  // Match Method
      ];
      ws['!cols'] = wscols;

      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, 'Prev Phase Uploaded');
      
      const outputPath = path.join(__dirname, '../../TVS_Phase5_Already_Uploaded_in_Phases_1_to_4.xlsx');
      xlsx.writeFile(wb, outputPath);
      console.log(`Excel report successfully generated at: ${outputPath}`);
    } else {
      console.log('No matches found. Excel file was not generated.');
    }

  } catch (err) {
    console.error('Error generating previous phase duplicate report:', err);
  } finally {
    await pool.end();
  }
}

generateReport();
