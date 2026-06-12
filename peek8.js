const fs = require("fs");
const XLSX = require("xlsx");

const buffer = fs.readFileSync("SANDEEP SIR JULY..xlsb");
const workbook = XLSX.read(buffer, { type: "buffer" });
const sheet = workbook.Sheets["Sheet1"];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

const headers = data[0];
let aprilCol = headers.findIndex(h => h && h.toString().includes("APRIL"));

let count = 0;
for(let i=1; i<data.length; i++) {
    const val = data[i][aprilCol];
    if (val && val.toString().trim() !== "") {
        count++;
    }
}
console.log("Count with APRIL:", count);
