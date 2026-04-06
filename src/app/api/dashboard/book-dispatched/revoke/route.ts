import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const role = session?.user?.role as any;
    if (!session || (role !== "ADMIN" && role !== "VENDOR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const workbook = XLSX.read(buffer, { type: "buffer" });
    const allResolvedIds: string[] = [];
    const rawRows: any[] = [];

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const data: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      for (const row of data) {
        const employeeId = String(row["Employee Id"] || row["Employee ID"] || "").trim();
        const whatsappNo = String(row["Whatsapp No"] || row["Whatsapp"] || "").trim();
        const mobileNo = String(row["Mobile No"] || row["Mobile"] || row["Personal Mobile No"] || "").trim();
        rawRows.push({ employeeId, whatsappNo, mobileNo });
      }
    }

    // Resolve IDs
    for (const row of rawRows) {
        if (row.employeeId) {
            allResolvedIds.push(row.employeeId);
        } else if (row.whatsappNo || row.mobileNo) {
            const match = await prisma.bookDeliveryMaster.findFirst({
                where: {
                    OR: [
                        { whatsappNo: row.whatsappNo || undefined },
                        { personalMobileNo: row.mobileNo || undefined },
                        { officeMobileNo: row.mobileNo || undefined },
                    ]
                },
                select: { employeeId: true }
            });
            if (match) allResolvedIds.push(match.employeeId);
        }
    }

    const uniqueIds = Array.from(new Set(allResolvedIds));

    if (uniqueIds.length === 0) {
      return NextResponse.json({ error: "No valid records found to reset" }, { status: 400 });
    }

    // Process Revocation: Remove from Dispatched AND Submissions
    await prisma.$transaction([
        prisma.bookDispatched.deleteMany({
            where: { employeeId: { in: uniqueIds } }
        }),
        prisma.addressRecord.deleteMany({
            where: { employeeId: { in: uniqueIds } }
        })
    ]);

    return NextResponse.json({ 
        success: true, 
        message: `Successfully reset ${uniqueIds.length} records. They can now re-submit their addresses and will appear in Pending.` 
    });

  } catch (error: any) {
    console.error("Revoke Error:", error);
    return NextResponse.json({ error: error.message || "Failed to reset addresses" }, { status: 500 });
  }
}
