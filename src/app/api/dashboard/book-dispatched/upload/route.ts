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
        });
      }
    }

    if (allFormattedData.length === 0) {
      return NextResponse.json({ error: "No valid employee records found in file" }, { status: 400 });
    }

    // High-performance batch insertion for dispatched list
    // We use skipDuplicates to avoid errors if someone is already in the list
    const result = await prisma.bookDispatched.createMany({
        data: allFormattedData,
        skipDuplicates: true,
    });

    return NextResponse.json({ 
        success: true, 
        message: `Successfully processed ${allFormattedData.length} records. ${result.count} new recipients added to Dispatched list.` 
    });

  } catch (error: any) {
    console.error("Dispatched Upload Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process dispatched file" }, { status: 500 });
  }
}
