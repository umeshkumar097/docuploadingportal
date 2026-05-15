const XLSX = require('xlsx');
const path = require('path');

async function audit() {
  try {
    const filePath = path.join(__dirname, '../../SMFG ENGLISH LIST.xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
    
    const target = data.find(r => String(r["Employee Id"]).includes("201494"));
    console.log("Data found in Excel for 201494:");
    console.log(JSON.stringify(target, null, 2));

  } catch (err) {
    console.error("ERROR:", err.message);
  }
}

audit();
