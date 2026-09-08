/**
 * Turns the raw Natural Earth 110m dataset into two build artifacts:
 *
 *   public/datasets/countries.geo.json  slim geometry for the globe (client)
 *   data/countries.meta.json            name / continent / centroid lookup (server)
 *
 * Why ADM0_A3 and not ISO_A2: the raw set stores "-99" for Norway, Northern Cyprus
 * and Somaliland, which is the exact cause of the v1 click-crash. ISO_A3 and
 * ISO_A3_EH are worse (they also drop France and Kosovo). ADM0_A3 is the only
 * field that is both complete and unique across all 177 features.
 * See DESIGN_PLAN.md section 5.
 *
 * Run: node scripts/prepare-countries.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const raw = JSON.parse(readFileSync(join(root, "data/countries.raw.geojson"), "utf8"));

/**
 * Countries whose ADM0_A3 is not a real ISO 3166-1 alpha-3 code. These are
 * disputed or partially recognised territories with no ISO assignment, so we
 * keep the ADM0_A3 key internally and record the closest external code here.
 */
const NON_ISO = {
  CYN: { note: "Northern Cyprus, no ISO assignment" },
  KOS: { iso3: "XKX", note: "Kosovo, user-assigned code" },
  SOL: { note: "Somaliland, no ISO assignment" },
};

/**
 * The dataset stores "-99" for these, which is why v1 crashed. Norway is a real
 * ISO country and the sentinel is simply a dataset defect, so its code is restored
 * (without it the country renders with no flag). Northern Cyprus and Somaliland
 * genuinely have no ISO assignment and correctly stay flagless.
 */
const ISO2_FIXES = {
  NOR: "NO",
};

/** Ring area via the shoelace formula. Sign is ignored; we only compare magnitudes. */
function ringArea(ring) {
  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    area += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  }
  return Math.abs(area / 2);
}

/** Area-weighted centroid of a single ring. */
function ringCentroid(ring) {
  let x = 0;
  let y = 0;
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const f = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
    a += f;
    x += (ring[j][0] + ring[i][0]) * f;
    y += (ring[j][1] + ring[i][1]) * f;
  }
  a *= 0.5;
  if (a === 0) {
    // Degenerate ring: fall back to the mean of its vertices.
    const mx = ring.reduce((s, p) => s + p[0], 0) / ring.length;
    const my = ring.reduce((s, p) => s + p[1], 0) / ring.length;
    return [mx, my];
  }
  return [x / (6 * a), y / (6 * a)];
}

/**
 * Centroid of the largest ring in the geometry. Using the largest ring rather
 * than an average across all of them keeps the camera on mainland USA instead
 * of dropping it in the Pacific between Alaska and Hawaii.
 */
function centroidOf(geometry) {
  const polygons =
    geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;

  let best = null;
  let bestArea = -1;
  for (const poly of polygons) {
    const outer = poly[0];
    if (!outer || outer.length < 3) continue;
    const area = ringArea(outer);
    if (area > bestArea) {
      bestArea = area;
      best = outer;
    }
  }
  if (!best) return null;
  const [lng, lat] = ringCentroid(best);
  return { lat: round(lat), lng: round(lng) };
}

const round = (n) => Math.round(n * 10000) / 10000;

/** Drop coordinate precision. 3 decimals is ~110m, far finer than a 110m-scale map needs. */
function slimCoords(coords) {
  if (typeof coords[0] === "number") {
    return [Math.round(coords[0] * 1000) / 1000, Math.round(coords[1] * 1000) / 1000];
  }
  return coords.map(slimCoords);
}

const meta = {};
const features = [];

for (const f of raw.features) {
  const p = f.properties;
  const id = p.ADM0_A3;

  if (!id || id === "-99") {
    throw new Error(`Feature "${p.ADMIN}" has no usable ADM0_A3 key`);
  }
  if (meta[id]) {
    throw new Error(`Duplicate ADM0_A3 key "${id}" (${p.ADMIN} vs ${meta[id].name})`);
  }

  const centroid = centroidOf(f.geometry);
  if (!centroid || !Number.isFinite(centroid.lat) || !Number.isFinite(centroid.lng)) {
    throw new Error(`Could not compute a centroid for "${p.ADMIN}"`);
  }

  const iso2 = p.ISO_A2 && p.ISO_A2 !== "-99" ? p.ISO_A2 : (ISO2_FIXES[id] ?? null);

  meta[id] = {
    id,
    name: p.ADMIN,
    continent: p.CONTINENT,
    region: p.SUBREGION,
    iso2,
    iso3: NON_ISO[id]?.iso3 ?? (p.ISO_A3 !== "-99" ? p.ISO_A3 : null),
    lat: centroid.lat,
    lng: centroid.lng,
  };

  /*
   * MAPCOLOR9 is Natural Earth's cartographic colouring field: no two countries
   * that share a border are given the same value. We carry it through as `tint`
   * so the globe can vary adjacent visited countries slightly and stop a region
   * like western Europe from merging into one solid blob.
   */
  const tint = Math.min(Math.max(Number(p.MAPCOLOR9) - 1, 0), 8);

  // The client only needs the key, a display name and the tint index.
  features.push({
    type: "Feature",
    properties: { id, name: p.ADMIN, tint },
    geometry: { type: f.geometry.type, coordinates: slimCoords(f.geometry.coordinates) },
  });
}

mkdirSync(join(root, "public/datasets"), { recursive: true });
writeFileSync(
  join(root, "public/datasets/countries.geo.json"),
  JSON.stringify({ type: "FeatureCollection", features })
);
writeFileSync(join(root, "data/countries.meta.json"), JSON.stringify(meta, null, 2));

const rawSize = readFileSync(join(root, "data/countries.raw.geojson")).length;
const slimSize = readFileSync(join(root, "public/datasets/countries.geo.json")).length;

console.log(`countries: ${features.length}`);
console.log(
  `client geojson: ${(rawSize / 1024).toFixed(0)}KB -> ${(slimSize / 1024).toFixed(0)}KB ` +
    `(-${(100 - (slimSize / rawSize) * 100).toFixed(0)}%)`
);
console.log(`without an ISO alpha-2: ${Object.values(meta).filter((c) => !c.iso2).length}`);
