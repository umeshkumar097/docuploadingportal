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
    const idParam = searchParams.get("id");

    if (!idParam) {
      return NextResponse.json({ error: "Missing IDs" }, { status: 400 });
    }

    const ids = idParam.split(",");

    // Batch delete from Master List
    const result = await prisma.bookDeliveryMaster.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({ success: true, message: `Successfully deleted ${result.count} record(s) from Master list.` });
  } catch (error: any) {
    console.error("Delete Master Error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete record" }, { status: 500 });
  }
}
