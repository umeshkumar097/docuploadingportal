import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId")?.trim();
    const mobileNumber = searchParams.get("mobileNumber")?.trim();

    if (!employeeId && !mobileNumber) {
      return NextResponse.json({ error: "Employee ID or Mobile Number is required" }, { status: 400 });
    }

    const employeeData = await prisma.masterEmployee.findFirst({
      where: {
        OR: [
          ...(employeeId ? [
            { employeeId: { equals: employeeId, mode: "insensitive" as const } },
            { employeeId: { contains: employeeId, mode: "insensitive" as const } }
          ] : []),
          ...(mobileNumber ? [
            { personalMobileNo: { contains: mobileNumber } }, 
            { officeMobileNo: { contains: mobileNumber } },
            { whatsappNo: { contains: mobileNumber } }
          ] : [])
        ]
      }
    });

    const allRelatedCandidates = await prisma.candidate.findMany({
      where: {
        OR: [
          ...(employeeId ? [
            { employeeId: { equals: employeeId, mode: "insensitive" as const } },
            { employeeId: { contains: employeeId, mode: "insensitive" as const } }
          ] : []),
          ...(mobileNumber ? [{ mobileNumber: { contains: mobileNumber } }] : [])
        ]
      },
      include: {
        _count: { select: { documents: true } }
      }
    });

    const completedCandidate = allRelatedCandidates.find((c: any) => 
      c.status !== "PENDING" || c._count.documents >= 4
    );

    const existingCandidate = allRelatedCandidates.find((c: any) => c.status === "PENDING");

    return NextResponse.json({ 
      success: true, 
      found: true, 
      data: employeeData,
      alreadySubmitted: !!completedCandidate,
      existingCandidate: existingCandidate ? {
        token: existingCandidate.token,
        id: existingCandidate.id,
        uploadedDocumentTypes: (await prisma.document.findMany({
          where: { candidateId: existingCandidate.id },
          select: { type: true }
        })).map((d: any) => d.type)
      } : null
    });

  } catch (error: any) {
    console.error("Lookup Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
