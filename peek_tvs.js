const fs = require("fs");
const XLSX = require("xlsx");

const files = fs.readdirSync("/Users/aiclex/Downloads/cruxdocprotal").filter(f => f.includes("TVS APRIL"));
console.log("Found files:", files);

if (files.length > 0) {
  const buffer = fs.readFileSync(files[0]);
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  console.log("First 3 rows:", data.slice(0, 3));
}
