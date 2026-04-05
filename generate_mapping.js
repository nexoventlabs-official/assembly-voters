const xlsx = require('xlsx');
const fs = require('fs');

const workbook = xlsx.readFile('C:\\Users\\Admin\\Desktop\\Assembly\\ZONE BREAKDOWN LIST (2).xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet, { defval: "" });

const mapping = {};

let currentDistrict = "";
for (let i = 1; i < data.length; i++) {
  const row = data[i];
  if (row["__EMPTY"] && typeof row["__EMPTY"] === "string" && row["__EMPTY"].trim() !== "") {
    currentDistrict = row["__EMPTY"].trim();
  }
  let assembly = row["__EMPTY_2"];
  if (typeof assembly === "string" && assembly.trim() !== "") {
    mapping[assembly.trim()] = currentDistrict;
  }
}

fs.writeFileSync('src/lib/assemblyToDistrict.json', JSON.stringify(mapping, null, 2));
console.log("Wrote mapping to src/lib/assemblyToDistrict.json");
