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

    // Parse Excel/CSV
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const allFormattedData: any[] = [];
    const seenEmployeeIds = new Set<string>();

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const data: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      for (const row of data) {
        const employeeId = String(row["Employee Id"] || row["Employee ID"] || "").trim();
        if (!employeeId || seenEmployeeIds.has(employeeId)) continue;

        seenEmployeeIds.add(employeeId);
        
        allFormattedData.push({
          employeeId,
          employeeName: String(row["Employee Name"] || row["Name"] || "").trim(),
          state: String(row["State"] || "").trim(),
          reportingManagerId: String(row["Reporting Manager ID"] || "").trim(),
          reportingManagerName: String(row["Reporting Manager Name"] || "").trim(),
          reportingManagerGroup: String(row["Reporting Manager Group"] || "").trim(),
          skipLevelManagerId: String(row["Skip Level Manager ID"] || "").trim(),
          skipLevelManagerName: String(row["Skip Level Manager Name"] || "").trim(),
          activeStatus: String(row["Active Status"] || "").trim(),
          email: String(row["Email"] || "").trim(),
          officeMobileNo: String(row["Office Mobile No"] || "").trim(),
          personalMobileNo: String(row["Personal Mobile No"] || row["Mobile"] || "").trim(),
          whatsappNo: String(row["Whatsapp No"] || "").trim(),
          vendor: String(row["Vendor"] || row["Organisation"] || "").trim(),
          phase: String(row["Phase"] || "Phase 1").trim(),
          region2: String(row["Region 2"] || "").trim(),
          location2: String(row["Location2"] || "").trim(),
          city: String(row["City"] || "").trim(),
          pincode: String(row["Pincode"] || "").trim(),
          draBatch: String(row["DRA Batch"] || "").trim(),
        });
      }
    }

    if (allFormattedData.length === 0) {
      return NextResponse.json({ error: "No valid employee records found in file" }, { status: 400 });
    }

    // Merge and Update logic using transactional upsert
    // Note: For large datasets (>1000), consider batching. For now, 300+ is fine.
    await prisma.$transaction(
        allFormattedData.map(item => 
          prisma.bookDeliveryMaster.upsert({
            where: { employeeId: item.employeeId },
            update: item,
            create: item,
          })
        )
    );

    return NextResponse.json({ 
        success: true, 
        message: `Successfully processed ${allFormattedData.length} records into the Book Delivery Master.` 
    });

  } catch (error: any) {
    console.error("Book Master Upload Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process book recipient file" }, { status: 500 });
  }
}
