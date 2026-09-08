import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { sanitiseIds } from "@/lib/countries";
import { shortId, isValidShortId } from "./ids";
import type { Globe, GlobeStore, NewGlobe } from "./types";

/**
 * Phase 1 persistence: one JSON file per globe under .data/globes/.
 * Deliberately dependency-free so `npm run dev` works with nothing installed
 * beyond the app itself. Replaced by Supabase in Phase 2.
 */

const DIR = join(process.cwd(), ".data", "globes");

const MAX_TITLE = 80;

async function pathFor(id: string) {
  return join(DIR, `${id}.json`);
}

function cleanTitle(title: string | null | undefined): string | null {
  if (typeof title !== "string") return null;
  const trimmed = title.trim().slice(0, MAX_TITLE);
  return trimmed.length > 0 ? trimmed : null;
}

export const fileStore: GlobeStore = {
  async get(id) {
    if (!isValidShortId(id)) return null;
    try {
      const raw = await readFile(await pathFor(id), "utf8");
      const parsed = JSON.parse(raw) as Globe;
      // Re-sanitise on read: a hand-edited file must not be able to crash the globe.
      return { ...parsed, countries: sanitiseIds(parsed.countries ?? []) };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw err;
    }
  },

  async create(input) {
    await mkdir(DIR, { recursive: true });

    // Retry on the (vanishingly unlikely) id collision instead of throwing.
    let id = shortId();
    for (let attempt = 0; attempt < 5; attempt++) {
      const existing = await this.get(id);
      if (!existing) break;
      id = shortId();
    }

    const now = new Date().toISOString();
    const globe: Globe = {
      id,
      countries: sanitiseIds(input.countries ?? []),
      title: cleanTitle(input.title),
      createdAt: now,
      updatedAt: now,
    };

    await writeFile(await pathFor(id), JSON.stringify(globe, null, 2));
    return globe;
  },

  async update(id, input) {
    const existing = await this.get(id);
    if (!existing) return null;

    const updated: Globe = {
      ...existing,
      countries: sanitiseIds(input.countries ?? []),
      title: cleanTitle(input.title),
      updatedAt: new Date().toISOString(),
    };

    await writeFile(await pathFor(id), JSON.stringify(updated, null, 2));
    return updated;
  },
};
