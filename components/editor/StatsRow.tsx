import type { GlobeStats } from "@/lib/stats";

/**
 * The numbers people screenshot. Mono numerals so digits do not jitter as the
 * count changes. Density runs tighter here than the rest of the page by design
 * (DESIGN_PLAN.md section 0).
 */
export function StatsRow({ stats }: { stats: GlobeStats }) {
  const items = [
    { label: "Countries", value: String(stats.countries) },
    { label: "of the world", value: `${stats.percentOfWorld}%` },
    { label: "Continents", value: `${stats.continents}/${stats.totalContinents}` },
  ];

  return (
    <dl className="grid grid-cols-3 gap-3">
      {items.map((item) => (
        <div key={item.label}>
          <dd className="font-mono text-2xl tabular-nums leading-none text-text">{item.value}</dd>
          <dt className="mt-1.5 text-xs text-muted">{item.label}</dt>
        </div>
      ))}
    </dl>
  );
}
