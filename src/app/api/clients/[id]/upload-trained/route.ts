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

    const { employeeIds } = await req.json();

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
        select: { id: true, employeeId: true }
    });

    if (candidates.length === 0) {
        return NextResponse.json({ 
            success: false, 
            error: "None of the provided Employee IDs match any candidate for this client." 
        });
    }

    const candidateIdsToUpdate = candidates.map((c: any) => c.id);
    const foundEmployeeIds = new Set(candidates.map((c: any) => c.employeeId));
    const notFoundCount = targetIds.filter((id: string) => !foundEmployeeIds.has(id)).length;

    // Update the status to TRAINED
    const updateResult = await prisma.candidate.updateMany({
        where: {
            id: {
                in: candidateIdsToUpdate
            }
        },
        data: {
            status: "TRAINED"
        }
    });

    return NextResponse.json({
        success: true,
        message: "Upload processed successfully.",
        count: updateResult.count,
        notFound: notFoundCount
    });

  } catch (error: any) {
    console.error("Error processing trained upload:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
