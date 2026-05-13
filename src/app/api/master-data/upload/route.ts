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

    const vendorNameLimit = role === "VENDOR" ? (session.user as any).vendorName : null;

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const phaseOverride = formData.get("phase") as string | null;
    const clientIdOverride = formData.get("clientId") as string | null;
    
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
        const getVal = (keys: string[]) => {
          for (const k of keys) {
            if (row[k] !== undefined && row[k] !== null && row[k] !== "") return String(row[k]).trim();
          }
          return "";
        };

        const employeeId = getVal(["Employee Id", "Employee ID", "ID", "EmployeeID"]);
        if (!employeeId || seenEmployeeIds.has(employeeId)) continue;

        seenEmployeeIds.add(employeeId);
        
        const phaseValue = (phaseOverride && phaseOverride.trim()) 
          ? phaseOverride.trim() 
          : getVal(["Phase", "Phases"]) || "Phase 1";

        allFormattedData.push({
          employeeId,
          employeeName: getVal(["Employee Name", "Name", "NAME", "Full Name"]),
          state: getVal(["State", "STATE"]),
          reportingManagerId: getVal(["Reporting Manager ID", "Reporting Manager Id"]),
          reportingManagerName: getVal(["Reporting Manager Name", "Reporting Manager Name"]),
          reportingManagerGroup: getVal(["Reporting Manager Group", "Reporting Manager Group"]),
          skipLevelManagerId: getVal(["Skip Level Manager ID", "Skip Level Manager Id"]),
          skipLevelManagerName: getVal(["Skip Level Manager Name", "Skip Level Manager Name"]),
          activeStatus: getVal(["Active Status", "Status"]),
          email: getVal(["Email", "Email id", "Mail id", "Email ID"]),
          officeMobileNo: getVal(["Office Mobile No", "Office Mobile"]),
          personalMobileNo: getVal(["Personal Mobile No", "Contact Number ", "Mobile Number", "Mobile", "Contact Number"]),
          whatsappNo: String(row["Whatsapp No"] || "").trim(),
          vendor: vendorNameLimit ? vendorNameLimit : getVal(["Vendor", "VENDOR"]),
          phase: phaseValue,
          region2: String(row["Region 2"] || "").trim(),
          location2: String(row["Location2"] || "").trim(),
          city: getVal(["City", "CITY", "Location"]),
          pincode: getVal(["Pincode", "Pincode ", "PINCODE"]),
          draBatch: getVal(["DRA Batch", "Batch No", "Batch"]),
          qualificationType: getVal(["Qualification Type", "Category", "Qualification", "Qualification ", "Highest Qualification"]).toUpperCase(),
          trainingMonth: getVal(["Training Month", "Month"]),
          uploadMonth: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
          clientId: (clientIdOverride && clientIdOverride.trim()) 
            ? clientIdOverride.trim() 
            : getVal(["Client ID", "ClientId", "Client"]),
          addressLine1: getVal(["Address", "Adress line 1", "Address line 1", "Home Address"]),
          highestQualification: getVal(["Qualification", "Qualification ", "Highest Qualification"]),
          employer: getVal(["Employer", "Company name", "Company"]),
        });
      }
    }

    if (allFormattedData.length === 0) {
      return NextResponse.json({ error: "No valid employee records found in file" }, { status: 400 });
    }

    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    const incomingEmployeeIds = allFormattedData.map(d => d.employeeId);

    // Find which IDs already exist in the current upload month
    const existingRecords = await prisma.masterEmployee.findMany({
      where: {
        uploadMonth: currentMonth,
        employeeId: { in: incomingEmployeeIds },
        clientId: (clientIdOverride && clientIdOverride.trim()) ? clientIdOverride.trim() : undefined,
      },
      select: { employeeId: true }
    });

    const existingIdsSet = new Set(existingRecords.map((r: { employeeId: string }) => r.employeeId));

    // Filter out the duplicates to return as a report
    const duplicateData = allFormattedData.filter((d: any) => existingIdsSet.has(d.employeeId));

    // High-performance batch insertion, skipping existing IDs as requested
    const result = await prisma.masterEmployee.createMany({
        data: allFormattedData,
        skipDuplicates: true,
    });

    return NextResponse.json({ 
        success: true, 
        message: `Successfully processed ${allFormattedData.length} records. ${result.count} new records added.`,
        duplicates: duplicateData
    });

  } catch (error: any) {
    console.error("Master Data Upload Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process upload file" }, { status: 500 });
  }
}
