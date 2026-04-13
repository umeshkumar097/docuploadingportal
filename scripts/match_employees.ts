import * as XLSX from "xlsx";
import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config();

// Use the existing prisma client instance to benefit from the adapter setup
import prisma from "../src/lib/prisma";

async function main() {
  console.log("Reading Excel file...");
  const workbook = XLSX.readFile("tvs books return.xlsx");
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const excelData = XLSX.utils.sheet_to_json(worksheet) as any[];

  console.log(`Fetched ${excelData.length} rows from Excel.`);

  console.log("Fetching Master Database records...");
  const masterEmployees = await prisma.masterEmployee.findMany({
    select: {
      employeeId: true,
      employeeName: true,
      personalMobileNo: true,
      whatsappNo: true,
      officeMobileNo: true,
    }
  });

  console.log(`Fetched ${masterEmployees.length} records from Master Database.`);

  const results: any[] = [];
  let matchedCount = 0;

  for (const row of excelData) {
    const rowName = String(row["Employee Name"] || "").trim().toUpperCase();
    const rowMobile = String(row["Personal Mobile No"] || "").trim();
    const rowWhatsapp = String(row["Whatsapp No"] || "").trim();

    // Clean mobile number (remove prefix if any, e.g., '91')
    const cleanMobile = (m: string) => m.replace(/^91/, "").replace(/\D/g, "");
    
    const m1 = cleanMobile(rowMobile);
    const m2 = cleanMobile(rowWhatsapp);

    let match = masterEmployees.find(me => {
       const mePersonal = me.personalMobileNo ? cleanMobile(me.personalMobileNo) : "";
       const meWhatsapp = me.whatsappNo ? cleanMobile(me.whatsappNo) : "";
       const meOffice = me.officeMobileNo ? cleanMobile(me.officeMobileNo) : "";

       return (m1 && (m1 === mePersonal || m1 === meWhatsapp || m1 === meOffice)) ||
              (m2 && (m2 === mePersonal || m2 === meWhatsapp || m2 === meOffice));
    });

    // Fallback to name match if no mobile match
    if (!match && rowName) {
      match = masterEmployees.find(me => {
        const meName = String(me.employeeName || "").trim().toUpperCase();
        return meName === rowName;
      });
    }

    if (match) {
      matchedCount++;
      results.push({
        ...row,
        MatchedID: match.employeeId,
        MatchedName: match.employeeName,
        MatchMethod: match.employeeName?.toUpperCase() === rowName ? "Name" : "Mobile"
      });
    } else {
      results.push({
        ...row,
        MatchedID: "NOT FOUND",
        MatchedName: "N/A",
        MatchMethod: "None"
      });
    }
  }

  console.log(`Matching complete. Matched: ${matchedCount}/${excelData.length}`);

  // Generate Markdown table
  let md = "# Matching Results\n\n";
  md += "| Excel Name | Excel Mobile | Matched ID | Matched Name | Method |\n";
  md += "|------------|--------------|------------|--------------|--------|\n";
  
  for (const res of results) {
    md += `| ${res["Employee Name"] || "N/A"} | ${res["Personal Mobile No"] || "N/A"} | **${res.MatchedID}** | ${res.MatchedName} | ${res.MatchMethod} |\n`;
  }

  const fs = require('fs');
  fs.writeFileSync("matching_results.md", md);
  console.log("Results written to matching_results.md");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // Note: The proxy doesn't expose disconnect directly, but it's fine for a script
  });
