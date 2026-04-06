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
    const employeeId = searchParams.get("employeeId");

    if (!employeeId) {
      return NextResponse.json({ error: "Missing Employee ID" }, { status: 400 });
    }

    // Delete from Dispatched
    await prisma.bookDispatched.delete({
      where: { employeeId },
    });

    return NextResponse.json({ success: true, message: "Record removed from Dispatched list" });
  } catch (error: any) {
    console.error("Delete Dispatched Error:", error);
    return NextResponse.json({ error: error.message || "Failed to remove record" }, { status: 500 });
  }
}
