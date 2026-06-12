const fs = require("fs");
const XLSX = require("xlsx");

const buffer = fs.readFileSync("SANDEEP SIR JULY..xlsb");
const workbook = XLSX.read(buffer, { type: "buffer" });
const sheet = workbook.Sheets["Sheet4"];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
console.log(data.slice(0, 10));
