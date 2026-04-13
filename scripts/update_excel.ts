import * as XLSX from "xlsx";
import * as dotenv from "dotenv";
dotenv.config();

// Use the existing prisma client instance
import prisma from "../src/lib/prisma";

async function main() {
  console.log("Reading Excel file...");
  const workbook = XLSX.readFile("tvs books return.xlsx");
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const excelData = XLSX.utils.sheet_to_json(worksheet) as any[];

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

  console.log("Processing and matching...");

  const cleanMobile = (m: any) => String(m || "").replace(/^91/, "").replace(/\D/g, "");

  const updatedData = excelData.map(row => {
    const rowName = String(row["Employee Name"] || "").trim().toUpperCase();
    const rowMobile = cleanMobile(row["Personal Mobile No"]);
    const rowWhatsapp = cleanMobile(row["Whatsapp No"]);

    let match = masterEmployees.find(me => {
       const mePersonal = cleanMobile(me.personalMobileNo);
       const meWhatsapp = cleanMobile(me.whatsappNo);
       const meOffice = cleanMobile(me.officeMobileNo);

       return (rowMobile && (rowMobile === mePersonal || rowMobile === meWhatsapp || rowMobile === meOffice)) ||
              (rowWhatsapp && (rowWhatsapp === mePersonal || rowWhatsapp === meWhatsapp || rowWhatsapp === meOffice));
    });

    if (!match && rowName) {
      match = masterEmployees.find(me => {
        const meName = String(me.employeeName || "").trim().toUpperCase();
        return meName === rowName;
      });
    }

    // Add exactly one new column "Employee ID"
    return {
      ...row,
      "Employee ID": match ? match.employeeId : "NOT FOUND"
    };
  });

  console.log("Creating updated Excel...");
  const newWorksheet = XLSX.utils.json_to_sheet(updatedData);
  const newWorkbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, sheetName);

  const outputPath = "tvs_books_return_updated.xlsx";
  XLSX.writeFile(newWorkbook, outputPath);
  console.log(`Success! Updated file saved as ${outputPath}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
