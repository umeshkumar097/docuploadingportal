const fs = require("fs");
const XLSX = require("xlsx");

function countRows(file) {
    if (!fs.existsSync(file)) return;
    const buffer = fs.readFileSync(file);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log(file, "has", data.length, "rows");
}
countRows("TVS APRIL 2026 TRG HOLD.xlsx");
countRows("tvsc hold may.xlsx");
countRows("SANDEEP SIR JULY..xlsb");
