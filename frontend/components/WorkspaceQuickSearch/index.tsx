"use client";

import { createPortal } from "react-dom";
import Link from "next/link";
import { Loader2, Package, Search, Ship } from "lucide-react";
import { useWorkspaceQuickSearch } from "./hooks/useWorkspaceQuickSearch";
import { MIN_CHARS } from "./constants";

export function WorkspaceQuickSearch() {
  const {
    inputId,
    listboxId,
    inputRef,
    wrapRef,
    query,
    loading,
    error,
    results,
    highlight,
    showPanel,
    pos,
    disabled,
    debounced,
    onQueryChange,
    onFocus,
    onKeyDown,
    onResultClick,
    setHighlight,
  } = useWorkspaceQuickSearch();

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
                  onClick={onResultClick}
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
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={onFocus}
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
