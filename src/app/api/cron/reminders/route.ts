import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendDropoffReminder, sendPartialUploadReminder } from "@/lib/email";

export const maxDuration = 60; // Allow enough time for cron execution

export async function GET(req: Request) {
  try {
    // Basic security for cron (in production, use a secret token)
    const authHeader = req.headers.get("authorization");
    if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    // Find candidates who are still PENDING and haven't been active in the last 10 minutes
    const inactiveCandidates = await prisma.candidate.findMany({
      where: {
        status: "PENDING",
        lastActiveAt: { lt: tenMinutesAgo },
        currentStep: { in: ["STARTED", "PERSONAL_INFO_DONE", "UPLOADING_DOCS"] }
      },
      include: {
        documents: true,
        emailLogs: true,
        client: true,
      }
    });

    let sentCount = 0;

    for (const candidate of inactiveCandidates) {
      // Rule: Send only 1 email max for drop-off / partial
      const hasReceivedReminder = candidate.emailLogs.some(
        (log: any) => log.type === "REMINDER_DROP" || log.type === "REMINDER_PARTIAL"
      );

      if (hasReceivedReminder) {
        continue; // Skip if they already got one
      }

      // Fetch master email
      if (!candidate.employeeId || !candidate.clientId) continue;

      const master = await prisma.masterEmployee.findFirst({
        where: { 
          employeeId: candidate.employeeId,
          clientId: candidate.clientId
        }
      });

      if (!master || !master.email) {
        continue; // Skip if no email found
      }

      if (candidate.currentStep === "STARTED" || candidate.currentStep === "PERSONAL_INFO_DONE") {
        // Complete Drop-off
        await sendDropoffReminder(master.email, candidate.name, candidate.id, candidate.client?.slug);
        sentCount++;
      } else if (candidate.currentStep === "UPLOADING_DOCS") {
        // Partial Upload
        const uploadedTypes = candidate.documents
          .filter((d: any) => d.fileUrl && d.status !== "REJECTED")
          .map((d: any) => d.type.replace(/_/g, " ")); // format ID_PROOF_FRONT to ID PROOF FRONT

        if (uploadedTypes.length > 0) {
          await sendPartialUploadReminder(master.email, candidate.name, uploadedTypes, candidate.id, candidate.client?.slug);
          sentCount++;
        } else {
          // If they reached UPLOADING_DOCS but didn't upload any docs actually, treat as normal dropoff
          await sendDropoffReminder(master.email, candidate.name, candidate.id, candidate.client?.slug);
          sentCount++;
        }
      }
    }

    return NextResponse.json({ success: true, emailsSent: sentCount });
  } catch (error: any) {
    console.error("Cron error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
