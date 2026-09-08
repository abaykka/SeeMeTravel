/**
 * Seeds the example globe the landing page links to. The local store is gitignored,
 * so this runs once after a fresh clone.
 *
 * Run: npm run seed
 */
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Read the ids straight out of lib/demo.ts so the two can never drift apart.
const demoSrc = readFileSync(join(root, "lib/demo.ts"), "utf8");
const id = demoSrc.match(/DEMO_GLOBE_ID\s*=\s*"([^"]+)"/)?.[1];
const countries = [...demoSrc.matchAll(/^\s*"([A-Z]{3})",$/gm)].map((m) => m[1]);

if (!id || countries.length === 0) {
  throw new Error("Could not read the demo globe definition from lib/demo.ts");
}

// Must match ALPHABET and LENGTH in lib/store/ids.ts, or the store rejects it on read
// and the seeded globe 404s.
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
if (id.length !== 6 || ![...id].every((c) => ALPHABET.includes(c))) {
  throw new Error(
    `DEMO_GLOBE_ID "${id}" is not a valid short id. Use 6 characters from "${ALPHABET}".`
  );
}

const meta = JSON.parse(readFileSync(join(root, "data/countries.meta.json"), "utf8"));
const unknown = countries.filter((c) => !meta[c]);
if (unknown.length > 0) {
  throw new Error(`Demo globe references unknown countries: ${unknown.join(", ")}`);
}

const dir = join(root, ".data", "globes");
mkdirSync(dir, { recursive: true });

const now = new Date().toISOString();
writeFileSync(
  join(dir, `${id}.json`),
  JSON.stringify({ id, countries, title: null, createdAt: now, updatedAt: now }, null, 2)
);

console.log(`seeded /g/${id} with ${countries.length} countries`);
