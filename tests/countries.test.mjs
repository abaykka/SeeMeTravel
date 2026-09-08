/**
 * Guards the country data layer. The v1 app crashed when you clicked Norway
 * because it keyed on ISO_A2, which is "-99" for three features. These tests
 * assert that can never happen again.
 *
 * Run: npm run test:countries
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const meta = JSON.parse(readFileSync(new URL("../data/countries.meta.json", import.meta.url)));
const geo = JSON.parse(
  readFileSync(new URL("../public/datasets/countries.geo.json", import.meta.url))
);

const entries = Object.values(meta);

test("every country has a usable key", () => {
  for (const c of entries) {
    assert.ok(c.id, `${c.name} has no id`);
    assert.notEqual(c.id, "-99", `${c.name} has a sentinel id`);
    assert.match(c.id, /^[A-Z]{3}$/, `${c.name} has a malformed id: ${c.id}`);
  }
});

test("keys are unique across the whole dataset", () => {
  const ids = entries.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("every country resolves to a finite centroid", () => {
  for (const c of entries) {
    assert.ok(Number.isFinite(c.lat), `${c.name} has a non-finite lat`);
    assert.ok(Number.isFinite(c.lng), `${c.name} has a non-finite lng`);
    assert.ok(c.lat >= -90 && c.lat <= 90, `${c.name} lat out of range: ${c.lat}`);
    assert.ok(c.lng >= -180 && c.lng <= 180, `${c.name} lng out of range: ${c.lng}`);
  }
});

test("the three countries that crashed v1 resolve correctly", () => {
  // Norway, Northern Cyprus and Somaliland carry ISO_A2 "-99" upstream.
  for (const id of ["NOR", "CYN", "SOL"]) {
    const c = meta[id];
    assert.ok(c, `${id} is missing from the metadata`);
    assert.ok(Number.isFinite(c.lat) && Number.isFinite(c.lng));
  }
  // Norway's centroid must actually be in Norway, not at (0,0).
  assert.ok(meta.NOR.lat > 58 && meta.NOR.lat < 72, "Norway centroid is not in Norway");
});

test("geojson and metadata cover exactly the same countries", () => {
  const geoIds = geo.features.map((f) => f.properties.id).sort();
  const metaIds = entries.map((c) => c.id).sort();
  assert.deepEqual(geoIds, metaIds);
});

test("every geojson feature carries an id and a name", () => {
  for (const f of geo.features) {
    assert.ok(f.properties.id, "feature without an id");
    assert.ok(f.properties.name, `feature ${f.properties.id} without a name`);
    assert.ok(f.geometry.coordinates.length > 0, `feature ${f.properties.id} has no geometry`);
  }
});

test("the dataset still has 177 countries", () => {
  // A guard against a silent upstream dataset swap.
  assert.equal(entries.length, 177);
});
