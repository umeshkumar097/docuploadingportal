import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const addresses = await prisma.addressRecord.findMany({
      orderBy: { createdAt: "desc" }
    });

    const masterEmployees = await prisma.masterEmployee.findMany();

    // Create a map for fast lookup
    const masterMap = new Map();
    masterEmployees.forEach((e: any) => masterMap.set(e.employeeId, e));

    // Enrich existing records
    const enrichedRecords = addresses.map((addr: any) => {
      const master = masterMap.get(addr.employeeId);
      return {
        ...addr,
        name: master?.employeeName || addr.name,
        officeMobileNo: master?.officeMobileNo || "",
        personalMobileNo: master?.personalMobileNo || "",
        whatsappNo: master?.whatsappNo || "",
        companyAgency: master?.vendor || addr.companyAgency,
      };
    });

    // Find pending (Master - Submitted)
    const submittedIds = new Set(addresses.map((a: any) => a.employeeId));
    const pendingRecords = masterEmployees.filter((e: any) => !submittedIds.has(e.employeeId));

    return NextResponse.json({
      records: enrichedRecords,
      pending: pendingRecords,
      totalMaster: masterEmployees.length
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { ids } = await req.json();
    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    await prisma.addressRecord.deleteMany({
      where: { id: { in: ids } }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
