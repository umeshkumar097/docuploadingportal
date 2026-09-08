import prisma from './src/lib/prisma';
import fs from 'fs';

const TVS_CLIENT_ID = "cmn30m1wi000404jshcme0rww";
const BATCH_NAME = "October 2026";
const trainedMap = JSON.parse(fs.readFileSync('/tmp/new_tvs_trained.json', 'utf-8'));
const holdMap    = JSON.parse(fs.readFileSync('/tmp/new_tvs_hold.json', 'utf-8'));
const trainedIds = new Set(Object.keys(trainedMap));
const holdIds    = new Set(Object.keys(holdMap));

async function main() {
  const allCandidates = await prisma.candidate.findMany({
    where: { clientId: TVS_CLIENT_ID },
    select: { id: true, employeeId: true, status: true, phase: true },
    orderBy: { createdAt: 'desc' }
  });

  const bestMap = new Map<string, any>();
  for (const c of allCandidates) {
    if (!c.employeeId || bestMap.has(c.employeeId)) continue;
    bestMap.set(c.employeeId, c);
  }

  const allSubmitted = [];
  for (const c of bestMap.values()) {
    if (c.status !== 'PENDING') {
      allSubmitted.push(c);
    }
  }

  const targetOctIds = new Set();
  const targetOctEmpIds = new Set();
  
  // Rule: All Submitted - Trained + Hold
  for (const c of allSubmitted) {
    const isTrained = trainedIds.has(c.employeeId);
    const isHold = holdIds.has(c.employeeId);

    if (!isTrained || isHold) {
      targetOctIds.add(c.id);
      targetOctEmpIds.add(c.employeeId);
    }
  }

  // 1. Force fix Phase on all candidates
  for (const [empId, c] of bestMap.entries()) {
    if (targetOctIds.has(c.id)) {
      if (c.phase !== BATCH_NAME) {
        await prisma.candidate.update({ where: { id: c.id }, data: { phase: BATCH_NAME } });
      }
    } else {
      if (c.phase === BATCH_NAME) {
        await prisma.candidate.update({ where: { id: c.id }, data: { phase: 'Legacy' } });
      }
    }
  }

  // 2. Force fix MasterEmployee
  const allMaster = await prisma.masterEmployee.findMany({
    where: { clientId: TVS_CLIENT_ID }
  });

  for (const m of allMaster) {
    if (targetOctEmpIds.has(m.employeeId)) {
      if (m.draBatch !== BATCH_NAME) {
        try {
          await prisma.masterEmployee.update({ where: { id: m.id }, data: { draBatch: BATCH_NAME, phase: BATCH_NAME, uploadMonth: BATCH_NAME } });
        } catch(e) {}
      }
    } else {
      if (m.draBatch === BATCH_NAME) {
        try {
          await prisma.masterEmployee.update({ where: { id: m.id }, data: { draBatch: 'Legacy', phase: 'Legacy', uploadMonth: 'Legacy' } });
        } catch(e) {}
      }
    }
  }

  console.log(`✅ Fully synchronized! Target Candidates: ${targetOctIds.size}`);
}

main().catch(console.error).finally(() => process.exit(0));
