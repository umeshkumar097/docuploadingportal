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
          officeMobileNo: String(row["Office Mobile No"] || "").trim(),
          personalMobileNo: String(row["Personal Mobile No"] || row["Mobile"] || row["Phone"] || "").trim(),
          whatsappNo: String(row["Whatsapp No"] || "").trim(),
          vendor: String(row["Vendor"] || row["Organisation"] || row["Agency"] || "").trim(),
          city: String(row["City"] || "").trim(),
          state: String(row["State"] || "").trim(),
          pincode: String(row["Pincode"] || "").trim(),
        });
      }
    }

    if (allFormattedData.length === 0) {
      return NextResponse.json({ error: "No valid employee records found in file" }, { status: 400 });
    }

    // Use transaction to clear and reload the master list for this campaign
    await prisma.$transaction([
        prisma.bookDeliveryMaster.deleteMany(),
        prisma.bookDeliveryMaster.createMany({
            data: allFormattedData,
        })
    ]);

    return NextResponse.json({ 
        success: true, 
        message: `Successfully processed ${allFormattedData.length} records into the Book Delivery Master.` 
    });

  } catch (error: any) {
    console.error("Book Master Upload Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process book recipient file" }, { status: 500 });
  }
}
