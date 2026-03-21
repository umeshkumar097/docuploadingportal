import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const mobileNumber = searchParams.get("mobileNumber");

    if (!employeeId && !mobileNumber) {
      return NextResponse.json({ error: "Employee ID or Mobile Number is required" }, { status: 400 });
    }

    const employeeData = await prisma.masterEmployee.findFirst({
      where: {
        OR: [
          ...(employeeId ? [{ employeeId }] : []),
          ...(mobileNumber ? [{ personalMobileNo: mobileNumber }, { officeMobileNo: mobileNumber }] : [])
        ]
      }
    });

    if (!employeeData) {
      return NextResponse.json({ error: "Employee not found", found: false }, { status: 404 });
    }

    return NextResponse.json({ success: true, found: true, data: employeeData });

  } catch (error: any) {
    console.error("Lookup Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
