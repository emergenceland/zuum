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

// Create a mapping of all the points
const points = json.features.filter(
  (feature) => feature.geometry.type === "Point"
);

const pointMap = new Map();
points.map((p) => {
  const key = `${p.geometry.coordinates[0]},${p.geometry.coordinates[1]}`;
  pointMap.set(key, p);
});

const ways = json.features.filter(
  (feature) => feature.geometry.type === "LineString"
);

// Remove points that have properties -- supposed to filter points that are not strictly part of the way
ways.map((way) => {
  const length = way.geometry.coordinates.length;
  const filteredCoords = way.geometry.coordinates.filter((coord) => {
    const key = `${coord[0]},${coord[1]}`;
    const pointExists = pointMap.get(key);
    return !pointExists;
  });

  console.log(
    `WAY`,
    way.properties?.name || "?",
    `${length} => ${filteredCoords.length} points.`
  );

  way.geometry.coordinates = filteredCoords;
});

const featureCollection = turf.featureCollection(ways);

fs.writeFileSync(
  fileName + "_ways_filtered.json",
  JSON.stringify(featureCollection, null, 2)
);

// Write ways to file with filtered points
