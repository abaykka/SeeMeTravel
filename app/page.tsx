import Link from "next/link";
import { GlobeHemisphereWestIcon } from "@phosphor-icons/react/dist/ssr";
import GlobeView from "@/components/globe/GlobeView";
import { ButtonLink } from "@/components/ui/Button";
import { DEMO_GLOBE_ID, DEMO_COUNTRIES } from "@/lib/demo";

/**
 * Phase 1 ships the hero only. The remaining six sections (live demo, stats,
 * trips, sharing, pricing, footer) are Phase 3. See DESIGN_PLAN.md section 4.1.
 */
export default function HomePage() {
  return (
    <div className="min-h-[100dvh]">
      <header className="flex h-16 items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2 text-sm font-medium text-text">
          <GlobeHemisphereWestIcon size={20} className="text-accent" />
          See Me Travel
        </Link>
        <ButtonLink href="/build" size="md">
          Build your globe
        </ButtonLink>
      </header>

      <main className="mx-auto grid max-w-[1400px] items-center gap-8 px-4 pt-12 md:grid-cols-[1fr_1.1fr] md:gap-12 md:px-8 md:pt-24">
        <div className="max-w-xl">
          {/* text-balance keeps this to two lines at desktop, per DESIGN_PLAN.md 4.1. */}
          <h1 className="max-w-[14ch] text-pretty text-4xl font-semibold leading-[1.05] tracking-tighter text-text md:text-6xl">
            Everywhere you have been, on one globe.
          </h1>
          <p className="mt-6 max-w-[46ch] text-base leading-relaxed text-muted">
            Mark the countries you have travelled and get a link worth sending.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink href="/build" size="lg">
              Build your globe
            </ButtonLink>
            <ButtonLink href={`/g/${DEMO_GLOBE_ID}`} variant="secondary" size="lg">
              See an example
            </ButtonLink>
          </div>
        </div>

        {/*
          A real globe, not a screenshot of one. It is the product, so showing it
          working is more persuasive than any amount of copy.
        */}
        <div className="relative h-[46dvh] w-full md:h-[72dvh]">
          <GlobeView selected={DEMO_COUNTRIES} className="absolute inset-0" />
        </div>
      </main>
    </div>
  );
}
