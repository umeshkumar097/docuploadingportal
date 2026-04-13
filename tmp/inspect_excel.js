const XLSX = require('xlsx');
const path = require('path');

const workbook = XLSX.readFile('tvs books return.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

console.log('Total rows:', data.length);
console.log('Columns:', Object.keys(data[0] || {}));
console.log('First 3 rows:', JSON.stringify(data.slice(0, 3), null, 2));
