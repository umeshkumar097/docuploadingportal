import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
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
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    // Map rows strictly based on the provided header names
    const formattedData = data.map((row) => ({
      employeeId: String(row["Employee Id"] || "").trim(),
      employeeName: String(row["Employee Name"] || "").trim(),
      state: String(row["State"] || "").trim(),
      reportingManagerId: String(row["Reporting Manager ID"] || "").trim(),
      reportingManagerName: String(row["Reporting Manager Name"] || "").trim(),
      reportingManagerGroup: String(row["Reporting Manager Group"] || "").trim(),
      skipLevelManagerId: String(row["Skip Level Manager ID"] || "").trim(),
      skipLevelManagerName: String(row["Skip Level Manager Name"] || "").trim(),
      activeStatus: String(row["Active Status"] || "").trim(),
      email: String(row["Email"] || "").trim(),
      officeMobileNo: String(row["Office Mobile No"] || "").trim(),
      personalMobileNo: String(row["Personal Mobile No"] || "").trim(),
      whatsappNo: String(row["Whatsapp No"] || "").trim(),
      vendor: String(row["Vendor"] || "").trim(),
      region2: String(row["Region 2"] || "").trim(),
      location2: String(row["Location2"] || "").trim(),
      draBatch: String(row["DRA Batch"] || "").trim(),
    })).filter(row => row.employeeId);

    if (formattedData.length === 0) {
      return NextResponse.json({ error: "No valid employee records found in file" }, { status: 400 });
    }

    // Upsert data using Prisma Transaction
    await prisma.$transaction(
        formattedData.map(emp => prisma.masterEmployee.upsert({
            where: { employeeId: emp.employeeId },
            update: emp,
            create: emp
        }))
    );

    return NextResponse.json({ 
        success: true, 
        message: `Successfully processed and saved ${formattedData.length} records.` 
    });

  } catch (error: any) {
    console.error("Master Data Upload Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process upload file" }, { status: 500 });
  }
}
