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
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    // Delete from Master List
    await prisma.bookDeliveryMaster.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Record deleted from Master list" });
  } catch (error: any) {
    console.error("Delete Master Error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete record" }, { status: 500 });
  }
}
