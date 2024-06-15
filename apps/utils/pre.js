const turf = require("@turf/turf");
const fs = require("fs");
const path = require("path");

const filePath = process.argv[2];

if (!filePath) {
  console.error("Please provide a file path as an argument.");
  process.exit(1);
}

// Load the geojson file
const fileName = path.basename(filePath, path.extname(filePath));
console.log(`Processing ${fileName} ...`);
const json = JSON.parse(fs.readFileSync(filePath, "utf-8"));

// Return a list of linestring features
const coordsToLineStrings = (points) => {
  const lineStrings = [];

  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];

    const lineString = turf.lineString([start, end]);
    lineString.properties.distance = turf.distance(start, end, {
      units: "meters",
    });

    lineStrings.push(lineString);
  }
  return lineStrings;
};

// Convert each LineString to Points
const pointsFeatureCollection = turf.featureCollection([]);
const segmentsFeatureCollection = turf.featureCollection([]);

const start = Date.now();
json.features.forEach((feature) => {
  if (feature.geometry.type === "LineString") {
    const lineStrings = coordsToLineStrings(feature.geometry.coordinates);
    segmentsFeatureCollection.features =
      segmentsFeatureCollection.features.concat(lineStrings);

    feature.geometry.coordinates.map((coord) =>
      pointsFeatureCollection.features.push(turf.point(coord))
    );
  }
});

// Write json map
const segmentMap = {};
let totalDistance = 0;
segmentsFeatureCollection.features.forEach((s) => {
  const start = s.geometry.coordinates[0];
  const end = s.geometry.coordinates[1];
  const startKey = start.join(",");
  const endKey = end.join(",");
  const key = `${startKey}_${endKey}`;
  totalDistance += s.properties.distance;
  s.properties.key = key;
  segmentMap[key] = s;
});

const end = Date.now();

console.log(`Processed ${json.features.length} ways in ${end - start}ms.`);

// Write the GeoJSON object to a file
fs.writeFileSync(
  fileName + "_points.json",
  JSON.stringify(pointsFeatureCollection, null, 2)
);

console.log(`Saved ${pointsFeatureCollection.features.length} points.`);

fs.writeFileSync(
  fileName + "_segments.json",
  JSON.stringify(segmentsFeatureCollection, null, 2)
);

console.log(`Saved ${segmentsFeatureCollection.features.length} segments.`);
console.log(`Total distance: ${(totalDistance / 1000).toFixed(3)} km.`);

fs.writeFileSync(
  fileName + "_segment_map.json",
  JSON.stringify(segmentMap, null, 2)
);

console.log(`Saved segment map.`);
