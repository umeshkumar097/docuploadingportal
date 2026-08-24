import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendSuccessEmail } from "@/lib/email";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const resolvedParams = await params;
    const token = resolvedParams.token;
    
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const body = await req.json();
    const { step } = body;

    // Validate if candidate exists
    const candidate = await prisma.candidate.findUnique({
      where: { token },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 });
    }

    // Global Correction Window: Until Sept 24, 2026, 23:59:59 IST
    const globalCorrectionDeadline = new Date("2026-09-24T23:59:59+05:30");
    let isCorrectionActive = Date.now() <= globalCorrectionDeadline.getTime();
    if (candidate.clientId) {
      const client = await prisma.client.findUnique({
        where: { id: candidate.clientId }
      });
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
    }

    // Only update active status if not completed
    // (allow update if correction window or canReupload is active)
    const submittedStatuses = ["READY", "READY_FOR_BATCH", "TRAINED", "ON_HOLD"];
    if (submittedStatuses.includes(candidate.status) && !candidate.canReupload && !isCorrectionActive) {
      return NextResponse.json({ message: "Candidate already completed" }, { status: 200 });
    }

    const updateData: any = {
      lastActiveAt: new Date(),
    };

    if (step === "COMPLETED") {
      updateData.status = "READY";
      updateData.currentStep = "COMPLETED";

      // Trigger Success Email
      if (candidate.employeeId && candidate.clientId) {
        // Find the MasterEmployee record to get the email
        // We use findFirst because uploadMonth can be anything
        const master = await prisma.masterEmployee.findFirst({
          where: { 
            employeeId: candidate.employeeId,
            clientId: candidate.clientId
          }
        });
        
        if (master && master.email) {
          // Fire and forget (don't block the UI response)
          sendSuccessEmail(master.email, candidate.name, candidate.id).catch(console.error);
        }
      }
    } else if (step) {
      updateData.currentStep = step;
    }

    await prisma.candidate.update({
      where: { token },
      data: updateData,
    });

    return NextResponse.json({ success: true, timestamp: updateData.lastActiveAt });
  } catch (error) {
    console.error("Heartbeat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
