const xlsx = require('xlsx');
const fs = require('fs');

const workbook = xlsx.readFile('C:\\Users\\Admin\\Desktop\\Assembly\\ZONE BREAKDOWN LIST (2).xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet, { defval: "" });

fs.writeFileSync('excel_sample.json', JSON.stringify(data.slice(0, 10), null, 2));
console.log("Wrote excel_sample.json");
