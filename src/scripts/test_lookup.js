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

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const employeeId = '201494';
    const clientId = 'cmoy8kbe3000204kwaz26w0h9';
    
    console.log(`Testing lookup for ${employeeId}...`);
    
    const employeeData = await prisma.masterEmployee.findFirst({
      where: {
        AND: [
          { clientId: clientId },
          { employeeId: employeeId }
        ]
      }
    });

    console.log("Master Record:", employeeData);

    if (employeeData) {
        const candidates = await prisma.candidate.findMany({
            where: {
                OR: [
                    { employeeId: employeeData.employeeId },
                    { mobileNumber: employeeData.personalMobileNo || "NONE" }
                ]
            }
        });
        console.log("Found candidates:", candidates.length);
    }

    console.log("SUCCESS: No 500 error in Prisma query.");

  } catch (err) {
    console.error("PRISMA ERROR REPRODUCED:", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
