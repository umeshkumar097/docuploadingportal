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
    const { 
      employeeId, 
      addressLine1: rawAddress, 
      addressLine2, 
      addressLine3, 
      city: rawCity, 
      state: rawState, 
      pincode: rawPincode, 
      bookLanguage 
    } = body;

    const trimmedAddress = rawAddress?.trim();
    const trimmedCity = rawCity?.trim();
    const trimmedState = rawState?.trim();
    const trimmedPincode = rawPincode?.trim();

    // Strict validation for mandatory fields
    if (!employeeId || !trimmedAddress || !trimmedCity || !trimmedState || !trimmedPincode || !bookLanguage) {
      return NextResponse.json({ error: "All mandatory fields must be filled" }, { status: 400 });
    }

    // NEW: Block JUNK addresses like "N/A", "na", "...", etc.
    const junkPatterns = ["n/a", "na", "none", "nil", "null", "ok", "test"];
    if (
      junkPatterns.includes(trimmedAddress.toLowerCase()) || 
      trimmedAddress.length < 3 && !/\d/.test(trimmedAddress)
    ) {
      return NextResponse.json({ 
        error: "Please provide a valid street address. Generic entries like 'N/A' are not allowed." 
      }, { status: 400 });
    }

    const city = trimmedCity;
    const state = trimmedState;
    const pincode = trimmedPincode;
    const addressLine1 = trimmedAddress;

    // NEW: Check if book is already dispatched
    const isDispatched = await prisma.bookDispatched.findUnique({
      where: { employeeId }
    });

    if (isDispatched) {
      return NextResponse.json({ 
        error: "Your book has already been dispatched. Address updates are no longer permitted." 
      }, { status: 403 });
    }

    const record = await prisma.addressRecord.upsert({
      where: { employeeId },
      update: {
        addressLine1,
        addressLine2: addressLine2 || null,
        addressLine3: addressLine3 || null,
        city,
        state,
        pincode,
        bookLanguage,
        updatedAt: new Date(),
      },
      create: {
        employeeId,
        addressLine1,
        addressLine2: addressLine2 || null,
        addressLine3: addressLine3 || null,
        city,
        state,
        pincode,
        bookLanguage,
      },
    });

    return NextResponse.json({ 
      success: true, 
      id: record.id,
      message: record.createdAt.getTime() === record.updatedAt?.getTime() ? "Created" : "Updated"
    });
  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json({ error: "Failed to submit address" }, { status: 500 });
  }
}
