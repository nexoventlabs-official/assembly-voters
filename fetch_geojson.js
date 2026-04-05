const fs = require('fs');
const https = require('https');

const url = 'https://raw.githubusercontent.com/geohacker/india/master/district/india_district.geojson';

https.get(url, (res) => {
  let body = '';

  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    try {
      const geojson = JSON.parse(body);
      const tnFeatures = geojson.features.filter(f => f.properties.NAME_1 === 'Tamil Nadu');
      
      const tnGeojson = {
        type: 'FeatureCollection',
        features: tnFeatures
      };
      
      fs.writeFileSync('src/lib/tn_districts.json', JSON.stringify(tnGeojson));
      console.log('Saved TN districts: ' + tnFeatures.length);
    } catch (e) {
      console.error(e);
    }
  });
}).on('error', (e) => {
  console.error(e);
});
