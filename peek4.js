const fs = require("fs");
const XLSX = require("xlsx");

const buffer = fs.readFileSync("SANDEEP SIR JULY..xlsb");
const workbook = XLSX.read(buffer, { type: "buffer" });
console.log("Sheets:", workbook.SheetNames);
for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`Sheet "${sheetName}" has ${data.length} rows`);
}
