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
    const { employeeId, fullAddress, city, state, pincode, bookLanguage } = body;

    // Strict validation for mandatory fields
    if (!employeeId || !fullAddress || !city || !state || !pincode || !bookLanguage) {
      return NextResponse.json({ error: "All mandatory fields must be filled" }, { status: 400 });
    }

    const record = await prisma.addressRecord.create({
      data: {
        employeeId,
        fullAddress,
        city,
        state,
        pincode,
        bookLanguage,
        // These are now optional
        name: null,
        phoneNumber: null,
        companyAgency: null
      }
    });

    return NextResponse.json({ success: true, id: record.id });
  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json({ error: "Failed to submit address" }, { status: 500 });
  }
}
