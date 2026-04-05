"use client";

import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Package, Search, Ship } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, type RefObject } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchWorkspaceQuickSearch, type WorkspaceQuickSearchRow } from "@/lib/workspace-quick-search";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";

const DEBOUNCE_MS = 260;
const MIN_CHARS = 2;

function useDropdownPosition(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
): { top: number; left: number; width: number } | null {
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const measure = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      top: r.bottom + 6,
      left: r.left,
      width: Math.max(r.width, 220),
    });
  }, [anchorRef]);

  useEffect(() => {
    if (!open) return;
    measure();
    const onWin = () => measure();
    window.addEventListener("scroll", onWin, true);
    window.addEventListener("resize", onWin);
    return () => {
      window.removeEventListener("scroll", onWin, true);
      window.removeEventListener("resize", onWin);
    };
  }, [open, measure]);

  return open ? pos : null;
}

export function WorkspaceQuickSearch() {
  const router = useRouter();
  const { selectedOrgId } = useOrganizationWorkspace();
  const inputId = useId();
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const seqRef = useRef(0);

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<WorkspaceQuickSearchRow[]>([]);
  const [highlight, setHighlight] = useState(0);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query), DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!selectedOrgId || debounced.trim().length < MIN_CHARS) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    const run = async () => {
      const seq = ++seqRef.current;
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        const rows = await fetchWorkspaceQuickSearch(supabase, {
          organizationId: selectedOrgId,
          query: debounced,
          limit: 10,
        });
        if (cancelled || seq !== seqRef.current) return;
        setResults(rows);
        setHighlight(0);
      } catch (e) {
        if (cancelled || seq !== seqRef.current) return;
        setResults([]);
        setError(e instanceof Error ? e.message : "Search failed");
      } finally {
        if (!cancelled && seq === seqRef.current) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [debounced, selectedOrgId]);

  const showPanel = Boolean(
    selectedOrgId && open && (query.trim().length >= MIN_CHARS || loading || error || results.length > 0),
  );

  const pos = useDropdownPosition(showPanel, wrapRef);

  useEffect(() => {
    if (!showPanel) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t)) return;
      if (document.getElementById(listboxId)?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [showPanel, listboxId]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showPanel && e.key === "ArrowDown" && query.trim().length >= MIN_CHARS) {
      setOpen(true);
      return;
    }
    if (!showPanel) return;

    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((i) => Math.min(i + 1, Math.max(0, results.length - 1)));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((i) => Math.max(0, i - 1));
      return;
    }
    if (e.key === "Enter" && results[highlight]) {
      e.preventDefault();
      const path = results[highlight]!.path;
      setOpen(false);
      setQuery("");
      router.push(path);
    }
  };

  const disabled = !selectedOrgId;

  const portalContent =
    showPanel && pos && typeof document !== "undefined"
      ? createPortal(
          <div
            id={listboxId}
            role="listbox"
            aria-label="Search suggestions"
            className="fixed z-[200] max-h-[min(320px,50dvh)] overflow-y-auto overscroll-contain rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-950"
            style={{
              top: pos.top,
              left: pos.left,
              width: pos.width,
            }}
          >
            {loading ? (
              <div className="flex items-center gap-2 px-3 py-2.5 text-xs text-zinc-500">
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
                Searching…
              </div>
            ) : null}
            {error ? (
              <p className="px-3 py-2 text-xs text-red-600 dark:text-red-400">{error}</p>
            ) : null}
            {!loading && !error && results.length === 0 && debounced.trim().length >= MIN_CHARS ? (
              <p className="px-3 py-2.5 text-xs text-zinc-500">No matches in this organization.</p>
            ) : null}
            {results.map((row, i) => {
              const Icon = row.kind === "shipment" ? Ship : Package;
              const sub =
                row.subtitle?.trim() ||
                (row.kind === "shipment" ? "Shipment" : "Container line");
              const active = i === highlight;
              return (
                <Link
                  key={`${row.kind}-${row.id}`}
                  href={row.path}
                  role="option"
                  aria-selected={active}
                  id={`${listboxId}-opt-${i}`}
                  className={`flex items-start gap-2.5 px-3 py-2 text-left text-xs transition-colors ${
                    active ? "bg-zinc-100 dark:bg-zinc-800" : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  }`}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  <Icon
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-zinc-900 dark:text-zinc-50">{row.title}</span>
                    <span className="mt-0.5 block text-[11px] text-zinc-500 dark:text-zinc-400">{sub}</span>
                  </span>
                </Link>
              );
            })}
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={wrapRef} className="relative">
      <label htmlFor={inputId} className="sr-only">
        Quick find shipment or container
      </label>
      <div
        className={`flex items-center gap-2 rounded-md border bg-white px-2.5 py-1.5 dark:bg-zinc-950 ${
          disabled
            ? "cursor-not-allowed border-zinc-100 opacity-60 dark:border-zinc-800"
            : "border-zinc-200 dark:border-zinc-700"
        }`}
      >
        <Search className="h-3.5 w-3.5 shrink-0 text-zinc-400" strokeWidth={2} aria-hidden />
        <input
          ref={inputRef}
          id={inputId}
          role="combobox"
          type="text"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          disabled={disabled}
          placeholder={disabled ? "Select organization…" : "Shipment or container…"}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          aria-expanded={showPanel}
          aria-controls={showPanel ? listboxId : undefined}
          aria-activedescendant={
            showPanel && results[highlight] ? `${listboxId}-opt-${highlight}` : undefined
          }
          aria-autocomplete="list"
          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none disabled:cursor-not-allowed dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-zinc-400" aria-hidden />
        ) : null}
      </div>
      {portalContent}
    </div>
  );
}
