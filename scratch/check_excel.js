const XLSX = require('xlsx');

async function checkHeaders() {
  const workbook = XLSX.readFile('TVS DRA April & MAY 2026 Attendance sheet.xlsx');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  console.log('Headers:', data[0]);
}

checkHeaders();
