import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: clientId } = await params;
    const session = await auth();
    const role = session?.user?.role;

    if (!session || (role !== "ADMIN" && role !== "SUPERADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { employeeIds, trainingMonth } = await req.json();

    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
        return NextResponse.json({ success: false, error: "No employee IDs provided" }, { status: 400 });
    }

    // Convert all incoming IDs to string for safe comparison
    const targetIds = employeeIds.map(id => id.toString().trim());

    // Find candidates that belong to this client and match the employee IDs
    const candidates = await prisma.candidate.findMany({
        where: {
            clientId: clientId,
            employeeId: {
                in: targetIds
            }
        },
        include: { documents: true }
    });

    const foundEmployeeIds = new Set(candidates.map((c: any) => c.employeeId));
    const notFoundIds = targetIds.filter((id: string) => !foundEmployeeIds.has(id));

    const candidateIdsToUpdate: string[] = [];
    const missingDocsIds: string[] = [];

    candidates.forEach((c: any) => {
      const isDra = c.isDraCertified;
      const docs = c.documents || [];
      const docCount = isDra 
        ? docs.filter((d: any) => d.type === "DRA_CERTIFICATE" && d.status !== "REJECTED").length
        : docs.filter((d: any) => d.type !== "DRA_CERTIFICATE" && d.status !== "REJECTED").length;
      
      const isSubmitted = c.status === "READY" || c.status === "TRAINED" || (isDra ? docCount >= 1 : docCount >= 4);

      if (isSubmitted) {
        candidateIdsToUpdate.push(c.id);
      } else {
        missingDocsIds.push(c.employeeId);
      }
    });

    if (candidateIdsToUpdate.length === 0) {
        return NextResponse.json({ 
            success: false, 
            error: "No valid candidates found to mark as Hold.",
            notFoundIds,
            missingDocsIds
        });
    }

    // Update the status to ON_HOLD and set trainingMonth if provided
    const updateData: any = { status: "ON_HOLD" };
    if (trainingMonth) {
        updateData.trainingMonth = trainingMonth;
    }

    const updateResult = await prisma.candidate.updateMany({
        where: {
            id: {
                in: candidateIdsToUpdate
            }
        },
        data: updateData
    });

    return NextResponse.json({
        success: true,
        message: "Upload processed.",
        count: updateResult.count,
        notFoundIds,
        missingDocsIds
    });

  } catch (error: any) {
    console.error("Error processing trained upload:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
