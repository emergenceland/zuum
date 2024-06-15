const polyline = require("@mapbox/polyline");
const path = require("path");
const turf = require("@turf/turf");
const fs = require("fs");

const DISTANCE_THRESHOLD_METERS = 13;
const options = { units: "meters" };

const isWithinDistance = (point, polyline) => {
  const distance = turf.pointToLineDistance(point, polyline, options);
  point.properties.distanceFromLine = distance;
  return distance <= DISTANCE_THRESHOLD_METERS;
};

const filePath = process.argv[2];

if (!filePath) {
  console.error("Please provide a file path as an argument.");
  process.exit(1);
}
// Load the geojson file
const fileName = path.basename(filePath, path.extname(filePath));
console.log(`Processing ${fileName} ...`);
const json = JSON.parse(fs.readFileSync(filePath, "utf-8"));

// Process poly
const polyLineEncoded =
  "n||lVgatjFOIQ_@_@SCQYKMYc@MGYMM[_@MC]SWWKSQ]UIMS_@YQKMYUOM[WG][WOGa@QK[MQYQOMMU_@a@QMOO]QOWUMKa@QISYMM[USQYQY]CGa@]EGQYYSMSU[SCQSa@[SKQYS[MKW[OKYWWOE]a@CKe@[ACUWSY]SOGY[IWa@OK[MWOQ]QWQIOW[YIQ[IUWOUGWSOe@[OIOWIOUM_@c@EUSQUU]AW";

// Can optionally cache this step
const polyLineLineString = polyline.toGeoJSON(polyLineEncoded);
polyLineLineString.coordinates = polyLineLineString.coordinates.map((coord) => [
  coord[1],
  coord[0],
]);

const start = Date.now();
const nearbyPoints = json.features.filter((point) =>
  isWithinDistance(point, polyLineLineString.coordinates)
);
const end = Date.now();

console.log(
  `[INFO] Processed ${json.features.length} basemap Points with ${polyLineLineString.coordinates.length} user Points in ${end - start}ms`
);

const featureCollection = turf.featureCollection([]);
featureCollection.features = nearbyPoints;

const outputPath = fileName + "_user.json";

// Write nearby points to file
// Write the GeoJSON object to a file
fs.writeFile(outputPath, JSON.stringify(featureCollection, null, 2), (err) => {
  if (err) {
    console.error("Error writing file", err);
  } else {
    console.log(
      `GeoJSON file has been saved with ${featureCollection.features.length} features.`
    );
  }
});
