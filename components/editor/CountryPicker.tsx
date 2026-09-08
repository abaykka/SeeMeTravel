"use client";

import { useId, useMemo, useRef, useState } from "react";
import { MagnifyingGlassIcon, CheckIcon } from "@phosphor-icons/react";
import { COUNTRY_LIST, flagOf, type Country } from "@/lib/countries";

type Props = {
  selected: ReadonlySet<string>;
  onPick: (country: Country) => void;
};

const MAX_RESULTS = 8;

/**
 * The keyboard-operable equivalent of clicking the globe. Accessibility floor in
 * DESIGN_PLAN.md 7.4 requires the globe never be the only way to add a country.
 */
export function CountryPicker({ selected, onPick }: Props) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const starts: Country[] = [];
    const contains: Country[] = [];
    for (const c of COUNTRY_LIST) {
      const name = c.name.toLowerCase();
      if (name.startsWith(q)) starts.push(c);
      else if (name.includes(q)) contains.push(c);
      if (starts.length >= MAX_RESULTS) break;
    }
    return [...starts, ...contains].slice(0, MAX_RESULTS);
  }, [query]);

  const visible = open && results.length > 0;

  function choose(country: Country) {
    onPick(country);
    setQuery("");
    setActive(0);
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!visible) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const country = results[active];
      if (country) choose(country);
    } else if (e.key === "Escape") {
      setQuery("");
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <label htmlFor={`${listId}-input`} className="mb-2 block text-sm font-medium text-text">
        Add a country
      </label>
      <div className="relative">
        <MagnifyingGlassIcon
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <input
          id={`${listId}-input`}
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={visible}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={visible ? `${listId}-opt-${active}` : undefined}
          autoComplete="off"
          value={query}
          placeholder="Search 177 countries"
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          className="h-10 w-full rounded-input border border-border bg-bg pl-9 pr-3 text-sm
                     text-text placeholder:text-muted focus:border-accent focus:outline-none"
        />
      </div>

      {visible && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Country results"
          className="absolute z-20 mt-2 w-full overflow-hidden rounded-card border border-border
                     bg-surface shadow-2xl shadow-black/50"
        >
          {results.map((c, i) => {
            const isSelected = selected.has(c.id);
            const flag = flagOf(c);
            return (
              <li
                key={c.id}
                id={`${listId}-opt-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(c);
                }}
                className={`flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm ${
                  i === active ? "bg-surface-hi text-text" : "text-muted"
                }`}
              >
                <span aria-hidden="true" className="w-5 shrink-0 text-base">
                  {flag ?? "•"}
                </span>
                <span className="flex-1 truncate">{c.name}</span>
                {isSelected && (
                  <>
                    <CheckIcon size={14} className="text-accent" aria-hidden="true" />
                    <span className="sr-only">already added</span>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
