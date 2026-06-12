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
    const columnMappingStr = formData.get("columnMapping") as string | null;
    
    let columnMapping: Record<string, string> = {};
    if (columnMappingStr) {
      try {
        columnMapping = JSON.parse(columnMappingStr);
      } catch (e) {
        console.warn("Invalid column mapping JSON", e);
      }
    }
    
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
        const getVal = (systemKey: string, defaultKeys: string[]) => {
          const mappedKey = columnMapping[systemKey];
          if (mappedKey && row[mappedKey] !== undefined && row[mappedKey] !== null && row[mappedKey] !== "") {
            return String(row[mappedKey]).trim();
          }
          for (const k of defaultKeys) {
            if (row[k] !== undefined && row[k] !== null && row[k] !== "") return String(row[k]).trim();
          }
          return "";
        };

        const employeeId = getVal("employeeId", ["Employee Id", "Employee ID", "ID", "EmployeeID", "EMP ID NO"]);
        if (!employeeId || seenEmployeeIds.has(employeeId)) continue;

        seenEmployeeIds.add(employeeId);
        
        const rawPhase = (phaseOverride && phaseOverride.trim()) 
          ? phaseOverride.trim() 
          : getVal("phase", ["Phase", "Phases"]) || "Phase 1";
        const phaseValue = rawPhase.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());

        allFormattedData.push({
          employeeId,
          employeeName: getVal("employeeName", ["Employee Name", "Name", "NAME", "Full Name", "First_Name"]),
          state: getVal("state", ["State", "STATE"]),
          reportingManagerId: getVal("reportingManagerId", ["Reporting Manager ID", "Reporting Manager Id"]),
          reportingManagerName: getVal("reportingManagerName", ["Reporting Manager Name", "Reporting Manager Name"]),
          reportingManagerGroup: getVal("reportingManagerGroup", ["Reporting Manager Group", "Reporting Manager Group"]),
          skipLevelManagerId: getVal("skipLevelManagerId", ["Skip Level Manager ID", "Skip Level Manager Id"]),
          skipLevelManagerName: getVal("skipLevelManagerName", ["Skip Level Manager Name", "Skip Level Manager Name"]),
          activeStatus: getVal("activeStatus", ["Active Status", "Status"]),
          email: getVal("email", ["Email", "Email id", "Mail id", "Email ID", "Candidates PERSONAL Email"]),
          officeMobileNo: getVal("officeMobileNo", ["Office Mobile No", "Office Mobile"]),
          personalMobileNo: getVal("personalMobileNo", ["Personal Mobile No", "Contact Number ", "Mobile Number", "Mobile", "Contact Number", "Candidates PERSONAL Mobile No"]),
          whatsappNo: String(row["Whatsapp No"] || "").trim(),
          vendor: vendorNameLimit ? vendorNameLimit : getVal("vendor", ["Vendor", "VENDOR"]),
          phase: phaseValue,
          region2: String(row["Region 2"] || "").trim(),
          location2: String(row["Location2"] || "").trim(),
          city: getVal("city", ["City", "CITY", "Location"]),
          pincode: getVal("pincode", ["Pincode", "Pincode ", "PINCODE"]),
          draBatch: getVal("draBatch", ["DRA Batch", "Batch No", "Batch", "Batch_Code"]),
          qualificationType: getVal("qualificationType", ["Qualification Type", "Category", "Qualification", "Qualification ", "Highest Qualification"]).toUpperCase(),
          trainingMonth: getVal("trainingMonth", ["Training Month", "Month"]),
          uploadMonth: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
          clientId: (clientIdOverride && clientIdOverride.trim()) 
            ? clientIdOverride.trim() 
            : getVal("clientId", ["Client ID", "ClientId", "Client"]),
          addressLine1: getVal("addressLine1", ["Address", "Adress line 1", "Address line 1", "Home Address", "Address_Line1"]),
          addressLine2: getVal("addressLine2", ["Address line 2", "Address_Line2"]),
          highestQualification: getVal("highestQualification", ["Qualification", "Qualification ", "Highest Qualification"]),
          employer: getVal("employer", ["Employer", "Company name", "Company"]),
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

    // Delete existing records for the current month so we can replace them (Upsert behavior)
    if (existingIdsSet.size > 0) {
      await prisma.masterEmployee.deleteMany({
        where: {
          uploadMonth: currentMonth,
          employeeId: { in: Array.from(existingIdsSet) },
          clientId: (clientIdOverride && clientIdOverride.trim()) ? clientIdOverride.trim() : undefined,
        }
      });
    }

    // High-performance batch insertion
    const result = await prisma.masterEmployee.createMany({
        data: allFormattedData,
        skipDuplicates: true,
    });

    return NextResponse.json({ 
        success: true, 
        message: `Successfully processed ${allFormattedData.length} records. (${existingIdsSet.size} existing records were updated).`,
        duplicates: [] 
    });

  } catch (error: any) {
    console.error("Master Data Upload Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process upload file" }, { status: 500 });
  }
}
