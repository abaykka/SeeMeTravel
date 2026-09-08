import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { GlobeHemisphereWestIcon } from "@phosphor-icons/react/dist/ssr";
import GlobeView from "@/components/globe/GlobeView";
import { ButtonLink } from "@/components/ui/Button";
import { ShareBar } from "@/components/share/ShareBar";
import { fileStore } from "@/lib/store/fileStore";
import { computeStats } from "@/lib/stats";
import { COUNTRIES } from "@/lib/countries";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const globe = await fileStore.get(id);
  if (!globe) return { title: "Globe not found" };

  const stats = computeStats(globe.countries);
  const title = `${stats.countries} countries, ${stats.percentOfWorld}% of the world`;
  const description = `A See Me Travel globe covering ${stats.countries} countries across ${stats.continents} continents.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "profile" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function GlobePage({ params }: Params) {
  const { id } = await params;
  const globe = await fileStore.get(id);
  if (!globe) notFound();

  const stats = computeStats(globe.countries);
  const visited = globe.countries
    .map((cid) => COUNTRIES[cid])
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden">
      <GlobeView selected={globe.countries} className="absolute inset-0" />

      <header className="absolute inset-x-0 top-0 z-10 flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 text-sm font-medium text-text">
          <GlobeHemisphereWestIcon size={20} className="text-accent" />
          See Me Travel
        </Link>
        {/* The share page is the acquisition surface, so the CTA is always present. */}
        <ButtonLink href="/build" size="md">
          Build your globe
        </ButtonLink>
      </header>

      <section
        aria-label="Globe summary"
        className="absolute inset-x-0 bottom-0 z-10 max-h-[58dvh] overflow-y-auto border-t
                   border-border bg-surface/85 p-4 backdrop-blur-xl
                   md:inset-x-auto md:bottom-6 md:left-6 md:max-h-[calc(100dvh-8rem)]
                   md:w-[21rem] md:rounded-card md:border md:p-5"
      >
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-4xl tabular-nums leading-none text-accent">
            {stats.countries}
          </span>
          <span className="text-sm text-muted">
            {stats.countries === 1 ? "country" : "countries"}
          </span>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
          <div>
            <dd className="font-mono text-xl tabular-nums text-text">{stats.percentOfWorld}%</dd>
            <dt className="mt-1 text-xs text-muted">of the world</dt>
          </div>
          <div>
            <dd className="font-mono text-xl tabular-nums text-text">
              {stats.continents}/{stats.totalContinents}
            </dd>
            <dt className="mt-1 text-xs text-muted">continents</dt>
          </div>
        </dl>

        {stats.byContinent.length > 0 && (
          <div className="mt-4 border-t border-border pt-4">
            <ul className="space-y-1.5">
              {stats.byContinent.map((c) => (
                <li key={c.name} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate text-muted">{c.name}</span>
                  <span className="font-mono text-xs tabular-nums text-text">
                    {c.count}
                    <span className="text-muted">/{c.total}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <details className="mt-4 border-t border-border pt-4">
          <summary className="cursor-pointer text-sm text-muted hover:text-text">
            All {visited.length} countries
          </summary>
          <p className="mt-2 text-sm leading-relaxed text-text">
            {visited.map((c) => c.name).join(", ")}
          </p>
        </details>

        <div className="mt-5 border-t border-border pt-5">
          <ShareBar id={globe.id} />
        </div>
      </section>
    </main>
  );
}
