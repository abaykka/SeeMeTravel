"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { XIcon, GlobeHemisphereWestIcon, ArrowRightIcon } from "@phosphor-icons/react";
import GlobeView from "@/components/globe/GlobeView";
import { CountryPicker } from "./CountryPicker";
import { StatsRow } from "./StatsRow";
import { Button } from "@/components/ui/Button";
import { COUNTRIES, sanitiseIds, flagOf, type Country } from "@/lib/countries";
import { computeStats } from "@/lib/stats";

const DRAFT_KEY = "smt.draft.v2";

/** localStorage can throw outright in private modes, so every access is guarded. */
function readDraft(): string[] {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return [];
    return sanitiseIds(JSON.parse(raw));
  } catch {
    return [];
  }
}

function writeDraft(ids: string[]) {
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(ids));
  } catch {
    // A draft that cannot be saved is not worth interrupting the user over.
  }
}

export function Editor() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [focus, setFocus] = useState<{ lat: number; lng: number } | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelected(readDraft());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeDraft(selected);
  }, [selected, hydrated]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const stats = useMemo(() => computeStats(selected), [selected]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const pick = useCallback((country: Country) => {
    setSelected((prev) => (prev.includes(country.id) ? prev : [...prev, country.id]));
    setFocus({ lat: country.lat, lng: country.lng });
  }, []);

  async function publish() {
    if (selected.length === 0 || publishing) return;
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch("/api/globes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countries: selected }),
      });
      if (!res.ok) throw new Error(`publish failed with ${res.status}`);
      const globe = (await res.json()) as { id: string };
      router.push(`/g/${globe.id}`);
    } catch (err) {
      console.error(err);
      setError("Could not publish your globe. Check your connection and try again.");
      setPublishing(false);
    }
  }

  const chips = selected
    .map((id) => COUNTRIES[id])
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden">
      <GlobeView
        selected={selected}
        onToggle={toggle}
        focus={focus}
        className="absolute inset-0"
      />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex h-16 items-center justify-between px-4 md:px-6">
        <Link
          href="/"
          className="pointer-events-auto flex items-center gap-2 text-sm font-medium text-text"
        >
          <GlobeHemisphereWestIcon size={20} weight="regular" className="text-accent" />
          See Me Travel
        </Link>
      </header>

      {/*
        Desktop: a panel floating over the globe on the right.
        Mobile: a bottom sheet, so the globe keeps the top half of the screen.
      */}
      <section
        aria-label="Globe editor"
        className="absolute inset-x-0 bottom-0 z-10 max-h-[62dvh] overflow-y-auto border-t
                   border-border bg-surface/85 p-4 backdrop-blur-xl
                   md:inset-x-auto md:bottom-auto md:right-6 md:top-20 md:max-h-[calc(100dvh-7rem)]
                   md:w-[22rem] md:rounded-card md:border md:p-5"
      >
        <CountryPicker selected={selectedSet} onPick={pick} />

        <div className="mt-5 border-t border-border pt-5">
          <StatsRow stats={stats} />
        </div>

        <div className="mt-5">
          {chips.length === 0 ? (
            <p className="text-sm leading-relaxed text-muted">
              Click a country on the globe, or search for one above. Your progress is saved in
              this browser as you go.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {chips.map((c) => {
                const flag = flagOf(c);
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => toggle(c.id)}
                      className="group flex items-center gap-1.5 rounded-input border border-border
                                 bg-bg py-1 pl-2 pr-1.5 text-xs text-text transition-colors
                                 hover:border-danger/60"
                    >
                      {flag && (
                        <span aria-hidden="true" className="text-sm">
                          {flag}
                        </span>
                      )}
                      {c.name}
                      <XIcon
                        size={12}
                        className="text-muted transition-colors group-hover:text-danger"
                        aria-hidden="true"
                      />
                      <span className="sr-only">Remove {c.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="mt-5 border-t border-border pt-5">
          <Button
            onClick={publish}
            disabled={selected.length === 0 || publishing}
            className="w-full"
          >
            {publishing ? "Publishing" : "Publish and get my link"}
            {!publishing && <ArrowRightIcon size={16} aria-hidden="true" />}
          </Button>
          {selected.length === 0 && (
            <p className="mt-2 text-center text-xs text-muted">Add at least one country</p>
          )}
        </div>
      </section>
    </main>
  );
}
