import { COUNTRIES, COUNTRY_COUNT, type Country } from "./countries";

export type GlobeStats = {
  countries: number;
  totalCountries: number;
  /** Percent of the world's countries, 0 to 100, one decimal. */
  percentOfWorld: number;
  continents: number;
  totalContinents: number;
  /** Continent name to visited count, ordered by count then name. */
  byContinent: { name: string; count: number; total: number }[];
};

/**
 * Natural Earth files one territory under "Seven seas (open ocean)", which is a
 * cartographic bucket rather than a continent. Counting it made the denominator
 * read 8, so it is excluded from both the total and the per-continent breakdown.
 */
const NOT_A_CONTINENT = new Set(["Seven seas (open ocean)"]);

const ALL_CONTINENTS = Array.from(
  new Set(Object.values(COUNTRIES).map((c) => c.continent))
)
  .filter((name) => !NOT_A_CONTINENT.has(name))
  .sort();

const CONTINENT_TOTALS = ALL_CONTINENTS.reduce<Record<string, number>>((acc, name) => {
  acc[name] = Object.values(COUNTRIES).filter((c) => c.continent === name).length;
  return acc;
}, {});

export function computeStats(ids: readonly string[]): GlobeStats {
  const visited = ids.map((id) => COUNTRIES[id]).filter(Boolean) as Country[];

  const counts = new Map<string, number>();
  for (const c of visited) {
    if (NOT_A_CONTINENT.has(c.continent)) continue;
    counts.set(c.continent, (counts.get(c.continent) ?? 0) + 1);
  }

  const byContinent = [...counts.entries()]
    .map(([name, count]) => ({ name, count, total: CONTINENT_TOTALS[name] ?? 0 }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return {
    countries: visited.length,
    totalCountries: COUNTRY_COUNT,
    percentOfWorld: Math.round((visited.length / COUNTRY_COUNT) * 1000) / 10,
    continents: counts.size,
    totalContinents: ALL_CONTINENTS.length,
    byContinent,
  };
}
