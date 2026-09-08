import metaJson from "@/data/countries.meta.json";

export type Country = {
  /** ADM0_A3. The internal key everywhere. See DESIGN_PLAN.md section 5. */
  id: string;
  name: string;
  continent: string;
  region: string;
  /** ISO 3166-1 alpha-2, used only for flag emoji. Null for 3 unrecognised territories. */
  iso2: string | null;
  iso3: string | null;
  lat: number;
  lng: number;
};

export const COUNTRIES = metaJson as Record<string, Country>;

export const COUNTRY_LIST: Country[] = Object.values(COUNTRIES).sort((a, b) =>
  a.name.localeCompare(b.name)
);

export const COUNTRY_COUNT = COUNTRY_LIST.length;

export function getCountry(id: string): Country | undefined {
  return COUNTRIES[id];
}

/**
 * Only keeps ids the dataset actually knows about, so a hand-edited or stale
 * payload can never reach the globe and crash it the way v1 did.
 */
export function sanitiseIds(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (typeof id === "string" && COUNTRIES[id] && !seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

/** Regional-indicator flag emoji. Returns null where there is no alpha-2 code. */
export function flagOf(country: Country): string | null {
  if (!country.iso2) return null;
  return String.fromCodePoint(
    ...[...country.iso2.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0))
  );
}
