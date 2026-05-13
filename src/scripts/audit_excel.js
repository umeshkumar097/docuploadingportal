const XLSX = require('xlsx');
const path = require('path');

async function audit() {
  try {
    const filePath = path.join(__dirname, '../../SMFG ENGLISH LIST.xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log("Headers found in Excel:");
    console.log(data[0]);
    
    console.log("\nFirst Data Row:");
    console.log(data[1]);
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}

audit();
