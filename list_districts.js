const d = require('./src/lib/tn_districts.json');
const fs = require('fs');

const geojsonDistricts = d.features.map(f => f.properties.NAME_2.toUpperCase()).sort();
fs.writeFileSync('available_districts.txt', geojsonDistricts.join('\n'));
