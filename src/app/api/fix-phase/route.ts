import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const updatedCandidates = await prisma.candidate.updateMany({
      where: { 
        phase: {
          contains: 'jine',
          mode: 'insensitive'
        }
      },
      data: {
        phase: 'June Phase 1'
      }
    });

    const updatedMD = await prisma.masterEmployee.updateMany({
      where: { 
        phase: {
          contains: 'jine',
          mode: 'insensitive'
        }
      },
      data: {
        phase: 'June Phase 1'
      }
    });

    return NextResponse.json({ 
      success: true, 
      updatedCandidates: updatedCandidates.count,
      updatedMD: updatedMD.count
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
