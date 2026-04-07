"use client";

import { useCallback, useEffect, useId, useRef, useState, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { loadWorkspaceQuickSearchBrowser } from "@/services/shipment.service";
import type { WorkspaceQuickSearchRow } from "@/services/workspace.service";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { DEBOUNCE_MS, MIN_CHARS } from "../constants";

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

export function useWorkspaceQuickSearch() {
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
        const rows = await loadWorkspaceQuickSearchBrowser({
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

  const onQueryChange = (value: string) => {
    setQuery(value);
    setOpen(true);
  };

  const onFocus = () => setOpen(true);

  const onResultClick = () => {
    setOpen(false);
    setQuery("");
  };

  const disabled = !selectedOrgId;

  return {
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
  };
}
