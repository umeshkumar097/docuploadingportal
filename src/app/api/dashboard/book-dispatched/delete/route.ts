import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    const role = session?.user?.role as any;
    if (!session || (role !== "ADMIN" && role !== "VENDOR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const employeeIdParam = searchParams.get("employeeId");

    if (!employeeIdParam) {
      return NextResponse.json({ error: "Missing Employee IDs" }, { status: 400 });
    }

    const employeeIds = employeeIdParam.split(",");

    // Batch delete from Dispatched
    const result = await prisma.bookDispatched.deleteMany({
      where: { employeeId: { in: employeeIds } },
    });

    return NextResponse.json({ success: true, message: `Successfully removed ${result.count} record(s) from Dispatched list.` });
  } catch (error: any) {
    console.error("Delete Dispatched Error:", error);
    return NextResponse.json({ error: error.message || "Failed to remove record" }, { status: 500 });
  }
}
