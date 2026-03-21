import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");

    if (!employeeId) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });
    }

    const employeeData = await prisma.masterEmployee.findUnique({
      where: { employeeId },
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
