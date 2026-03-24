import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const mobileNumber = searchParams.get("mobileNumber");

    if (!employeeId && !mobileNumber) {
      return NextResponse.json({ error: "Employee ID or Mobile Number is required" }, { status: 400 });
    }

    const employeeData = await prisma.masterEmployee.findFirst({
      where: {
        OR: [
          ...(employeeId ? [{ employeeId }] : []),
          ...(mobileNumber ? [{ personalMobileNo: mobileNumber }, { officeMobileNo: mobileNumber }] : [])
        ]
      }
    });

    const existingCandidate = await prisma.candidate.findFirst({
      where: {
        OR: [
          ...(employeeId ? [{ employeeId }] : []),
          ...(mobileNumber ? [{ mobileNumber }] : [])
        ],
        status: { not: "READY" }
      },
      include: {
        documents: {
          select: { type: true }
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      found: true, 
      data: employeeData,
      existingCandidate: existingCandidate ? {
        token: existingCandidate.token,
        id: existingCandidate.id,
        uploadedDocumentTypes: existingCandidate.documents.map((d: any) => d.type)
      } : null
    });

  } catch (error: any) {
    console.error("Lookup Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
