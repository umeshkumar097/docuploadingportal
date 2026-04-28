import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> | { token: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const token = resolvedParams.token;
    
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const body = await req.json();
    const { 
      name, employer, mobileNumber, employeeId, idType, idNumber, 
      residentialState, city, pincode, phase, isDraCertified,
      addressLine1, addressLine2, bookLanguage, trainingLanguage, examCenter, trainingMonth,
      highestQualification
    } = body;

    // Validate if candidate exists
    const candidate = await prisma.candidate.findUnique({
      where: { token },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 });
    }

    // Block updates if already completed AND re-upload not explicitly allowed
    if (candidate.status === "READY" && !candidate.canReupload) {
      return NextResponse.json({ error: "Candidate session already finalised" }, { status: 403 });
    }

    // Auto-save the provided data
    const updatedCandidate = await prisma.candidate.update({
      where: { token },
      data: {
        ...(name !== undefined && { name }),
        ...(employer !== undefined && { employer }),
        ...(mobileNumber !== undefined && { mobileNumber }),
        ...(employeeId !== undefined && { employeeId }),
        ...(residentialState !== undefined && { residentialState }),
        ...(city !== undefined && { city }),
        ...(pincode !== undefined && { pincode }),
        ...(phase !== undefined && { phase }),
        ...(idType !== undefined && { idType }),
        ...(idNumber !== undefined && { idNumber }),
        ...(isDraCertified !== undefined && { isDraCertified }),
        ...(addressLine1 !== undefined && { addressLine1 }),
        ...(addressLine2 !== undefined && { addressLine2 }),
        ...(bookLanguage !== undefined && { bookLanguage }),
        ...(trainingLanguage !== undefined && { trainingLanguage }),
        ...(examCenter !== undefined && { examCenter }),
        ...(trainingMonth !== undefined && { trainingMonth }),
        ...(highestQualification !== undefined && { highestQualification }),
        lastActiveAt: new Date(),
        currentStep: "PERSONAL_INFO_DONE"
      },
      select: {
        name: true,
        employer: true,
        residentialState: true,
        mobileNumber: true,
        employeeId: true,
        phase: true,
        city: true,
        pincode: true,
        idType: true,
        idNumber: true,
        isDraCertified: true,
        addressLine1: true,
        addressLine2: true,
        bookLanguage: true,
        trainingLanguage: true,
        examCenter: true,
        trainingMonth: true,
        highestQualification: true,
        lastActiveAt: true,
        currentStep: true
      }
    });

    return NextResponse.json({ success: true, data: updatedCandidate });
  } catch (error) {
    console.error("Auto-save error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
