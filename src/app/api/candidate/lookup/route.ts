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
                AND: [
                    { clientId: employeeData.clientId },
                    {
                        OR: [
                            { employeeId: employeeData.employeeId },
                            employeeData.personalMobileNo ? { mobileNumber: employeeData.personalMobileNo } : { employeeId: "NONE_ID" }
                        ]
                    }
                ]
            },
            include: {
                _count: { select: { documents: true } }
            }
        });
    }

    // Fetch client to check if correction window is active
    const client = await prisma.client.findUnique({
      where: { id: employeeData.clientId }
    });
    
    let isCorrectionActive = false;
    if (client && client.formConfig) {
      const config = client.formConfig as any;
      if (config.correctionUntil === "ALWAYS") {
        isCorrectionActive = true;
      } else if (config.correctionUntil) {
        const until = new Date(config.correctionUntil);
        if (until.getTime() > Date.now()) {
          isCorrectionActive = true;
        }
      }
    }

    const completedCandidate = candidates.find((c: any) => c.status === "READY" && !c.canReupload && !isCorrectionActive);
    const pendingCandidate = candidates.find((c: any) => c.status === "PENDING") || candidates.find((c: any) => c.canReupload || isCorrectionActive);

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
            ...pendingCandidate,
            uploadedDocumentTypes: docs.map((d: any) => d.type)
        };
    }

    return NextResponse.json({ 
      success: true, 
      found: true, 
      data: employeeData,
      alreadySubmitted: !!completedCandidate,
      existingCandidate,
      isCorrectionActive
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
