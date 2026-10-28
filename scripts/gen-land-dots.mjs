// Generates an evenly spaced grid of [lat, lng] points that fall on land.
// Run once: `node scripts/gen-land-dots.mjs` -> src/data/land-dots.json
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { feature } from "topojson-client";
import { geoContains } from "d3-geo";

const require = createRequire(import.meta.url);
const topo = JSON.parse(
  readFileSync(require.resolve("world-atlas/land-110m.json"), "utf8"),
);
const land = feature(topo, topo.objects.land);

const STEP = 1.9; // degrees between rows
const points = [];

for (let lat = -58; lat <= 78; lat += STEP) {
  // Widen the longitude step near the poles so dots stay evenly spaced on the sphere.
  const lngStep = STEP / Math.max(Math.cos((lat * Math.PI) / 180), 0.2);
  for (let lng = -180; lng < 180; lng += lngStep) {
    if (geoContains(land, [lng, lat])) {
      points.push([Math.round(lat * 10) / 10, Math.round(lng * 10) / 10]);
    }
  }
}

mkdirSync("src/data", { recursive: true });
writeFileSync("src/data/land-dots.json", JSON.stringify(points));
console.log(`wrote ${points.length} land dots`);
