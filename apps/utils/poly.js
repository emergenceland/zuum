const polyline = require("@mapbox/polyline");
const turf = require("@turf/turf");
const fs = require("fs");

const baseLongitude = -122.86937;
const baseLatitude = 38.61026;
const coordinates = [];

for (let i = 0; i < 100; i++) {
  const longitude = baseLongitude + i * 0.0001 + (Math.random() - 0.5) * 0.0001;
  const latitude = baseLatitude + i * 0.0001 + (Math.random() - 0.5) * 0.0001;
  coordinates.push([longitude, latitude]);
}

const featureCollection = turf.featureCollection([
  turf.lineString(coordinates),
]);

// Encode the coordinates into a polyline
const encodedHealdsburgPolyline = polyline.encode(coordinates);
console.log(
  "Encoded Polyline:",
  JSON.stringify({ line: encodedHealdsburgPolyline })
);

fs.writeFileSync("healdsburg_polyline.json", JSON.stringify(featureCollection));

console.log("GeoJSON file has been saved");
