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

    const bookMasters = await prisma.bookDeliveryMaster.findMany();
    const dispatched = await prisma.bookDispatched.findMany();

    // Create sets for fast lookup
    const dispatchedIds = new Set(dispatched.map(d => d.employeeId));
    const submittedIds = new Set(addresses.map(a => a.employeeId));
    
    // Create a map for master data
    const masterMap = new Map();
    bookMasters.forEach((e: any) => masterMap.set(e.employeeId, e));

    // 1. Submissions (Submitted & Not Dispatched)
    const enrichedRecords = addresses
      .filter((addr: any) => !dispatchedIds.has(addr.employeeId))
      .map((addr: any) => {
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

    // 2. Pending (Not Submitted & Not Dispatched)
    const pendingRecords = bookMasters.filter((e: any) => 
        !submittedIds.has(e.employeeId) && !dispatchedIds.has(e.employeeId)
    );

    // 3. Dispatched (Anyone in Dispatched list)
    const dispatchedRecords = Array.from(dispatchedIds).map(id => {
      const master = masterMap.get(id);
      const submission = addresses.find((a: any) => a.employeeId === id);
      
      return {
        employeeId: id,
        name: master?.employeeName || submission?.name || "Unknown",
        vendor: master?.vendor || submission?.companyAgency || "N/A",
        officeMobileNo: master?.officeMobileNo || "",
        personalMobileNo: master?.personalMobileNo || submission?.phoneNumber || "",
        address: submission ? [submission.addressLine1, submission.addressLine2, submission.addressLine3].filter(Boolean).join(", ") : "Address Not Captured",
        dispatchedAt: dispatched.find(d => d.employeeId === id)?.dispatchedAt
      };
    });

    return NextResponse.json({
      records: enrichedRecords,
      pending: pendingRecords,
      dispatched: dispatchedRecords,
      totalMaster: bookMasters.length
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
