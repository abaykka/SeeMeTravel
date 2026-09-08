"use client";

import { useEffect, useState } from "react";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";

export function ShareBar({ id }: { id: string }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  // Built on the client so the link is correct on localhost, previews and production alike.
  useEffect(() => {
    setUrl(`${window.location.origin}/g/${id}`);
  }, [id]);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(t);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Clipboard is blocked without a user gesture in some browsers; the input
      // is selectable, so the user can still copy by hand.
    }
  }

  return (
    <div>
      <label htmlFor="share-url" className="mb-2 block text-sm font-medium text-text">
        Share this globe
      </label>
      <div className="flex gap-2">
        <input
          id="share-url"
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="h-10 min-w-0 flex-1 rounded-input border border-border bg-bg px-3
                     font-mono text-xs text-text focus:border-accent focus:outline-none"
        />
        <button
          type="button"
          onClick={copy}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-input
                     border border-border bg-bg text-muted transition-colors
                     hover:bg-surface-hi hover:text-text"
        >
          {copied ? (
            <CheckIcon size={16} className="text-accent" aria-hidden="true" />
          ) : (
            <CopyIcon size={16} aria-hidden="true" />
          )}
          <span className="sr-only">{copied ? "Link copied" : "Copy link"}</span>
        </button>
      </div>
      <p aria-live="polite" className="sr-only">
        {copied ? "Link copied to clipboard" : ""}
      </p>
    </div>
  );
}
