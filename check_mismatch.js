const d = require('./src/lib/tn_districts.json');
const mapping = require('./src/lib/assemblyToDistrict.json');

const geojsonDistricts = d.features.map(f => f.properties.NAME_2.toUpperCase());
const excelDistricts = [...new Set(Object.values(mapping).map(x => x.toUpperCase()))];

const missing = excelDistricts.filter(x => !geojsonDistricts.includes(x));
console.log("Missing from geojson:", missing);
