const fs = require("fs");
const XLSX = require("xlsx");

const buffer = fs.readFileSync("SANDEEP SIR JULY..xlsb");
const workbook = XLSX.read(buffer, { type: "buffer" });
const sheet = workbook.Sheets["Sheet1"];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

const headers = data[0];
let actionCol = headers.indexOf("DRA Training Action");
if (actionCol === -1) {
   actionCol = headers.findIndex(h => h.includes("Action"));
}

let countMap = {};
for(let i=1; i<data.length; i++) {
    const val = data[i][actionCol];
    countMap[val] = (countMap[val] || 0) + 1;
}
console.log(countMap);
