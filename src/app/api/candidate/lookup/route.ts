import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  console.log("--- LOOKUP API START ---");
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const mobileNumber = searchParams.get("mobileNumber");
    const clientId = searchParams.get("clientId");

    console.log(`Params: emp=${employeeId}, mobile=${mobileNumber}, client=${clientId}`);

    if (!employeeId && !mobileNumber) {
      return NextResponse.json({ success: false, error: "Missing ID or Mobile" }, { status: 400 });
    }

    // Ultra-simple query to prevent any 500 error
    const employeeData = await prisma.masterEmployee.findFirst({
      where: {
        AND: [
          clientId ? { clientId: clientId } : {},
          employeeId ? { employeeId: employeeId } : {}
        ]
      }
    });

    console.log("Master Data Found:", !!employeeData);

    if (!employeeData) {
        return NextResponse.json({ success: true, found: false });
    }

    // If master data found, check for candidates
    let candidates: any[] = [];
    if (employeeData && employeeData.employeeId) {
        candidates = await prisma.candidate.findMany({
            where: {
                OR: [
                    { employeeId: employeeData.employeeId },
                    employeeData.personalMobileNo ? { mobileNumber: employeeData.personalMobileNo } : { employeeId: "NONE_ID" }
                ]
            },
            include: {
                _count: { select: { documents: true } }
            }
        });
    }

    const completedCandidate = candidates.find((c: any) => c.status === "READY");
    const pendingCandidate = candidates.find((c: any) => c.status === "PENDING") || candidates.find((c: any) => c.canReupload);

    let existingCandidate = null;
    if (pendingCandidate) {
        const docs = await prisma.document.findMany({
            where: { 
                candidateId: pendingCandidate.id,
                status: { not: "REJECTED" }
            },
            select: { type: true }
        });
        existingCandidate = {
            token: pendingCandidate.token,
            id: pendingCandidate.id,
            canReupload: pendingCandidate.canReupload,
            highestQualification: pendingCandidate.highestQualification,
            uploadedDocumentTypes: docs.map((d: any) => d.type)
        };
    }

    return NextResponse.json({ 
      success: true, 
      found: true, 
      data: employeeData,
      alreadySubmitted: !!completedCandidate,
      existingCandidate
    });

  } catch (error: any) {
    console.error("CRITICAL LOOKUP ERROR:", error);
    return NextResponse.json({ 
        success: false, 
        error: "Internal Server Error", 
        message: error.message
    }, { status: 500 });
  }
}
