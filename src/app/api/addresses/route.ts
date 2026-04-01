import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // Check if form is enabled
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "ADD_FORM_ENABLED" }
    });
    
    if (setting && setting.value === "false") {
      return NextResponse.json({ error: "Form is currently closed" }, { status: 403 });
    }

    const body = await req.json();
    const { employeeId, phoneNumber, name, companyAgency, fullAddress, city, state, pincode } = body;

    // Strict validation
    if (!employeeId || !phoneNumber || !name || !companyAgency || !fullAddress || !city || !state || !pincode) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const record = await prisma.addressRecord.create({
      data: {
        employeeId,
        phoneNumber,
        name,
        companyAgency,
        fullAddress,
        city,
        state,
        pincode
      }
    });

    return NextResponse.json({ success: true, id: record.id });
  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json({ error: "Failed to submit address" }, { status: 500 });
  }
}
