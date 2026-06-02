"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Loader2, Radio } from "lucide-react";
import {
  DASHBOARD_SYNC_HEALTH_LINK_CLASS,
  DASHBOARD_SYNC_HEALTH_PANEL_CLASS,
  DASHBOARD_SYNC_HEALTH_SUBTITLE_CLASS,
  DASHBOARD_SYNC_HEALTH_TITLE_CLASS,
} from "./constants";
import type { DashboardSyncHealthProps } from "./types";
import { buildSyncHealthRows, syncHealthCallout } from "./utils";

export function DashboardSyncHealth({ metrics, loading }: DashboardSyncHealthProps) {
  if (loading) {
    return (
      <section className={DASHBOARD_SYNC_HEALTH_PANEL_CLASS} aria-busy="true">
        <h2 className={DASHBOARD_SYNC_HEALTH_TITLE_CLASS}>Carrier sync health</h2>
        <div className="mt-6 flex min-h-40 items-center justify-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
          <span>Loading sync status...</span>
        </div>
      </section>
    );
  }

  if (!metrics) {
    return (
      <section className={DASHBOARD_SYNC_HEALTH_PANEL_CLASS}>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Sign in to see carrier sync health.</p>
      </section>
    );
  }

  const rows = buildSyncHealthRows(metrics);
  const callout = syncHealthCallout(metrics);

  return (
    <section className={DASHBOARD_SYNC_HEALTH_PANEL_CLASS}>
      <div className="flex items-start gap-2">
        <Radio className="mt-0.5 h-4 w-4 shrink-0 text-primary-orange" aria-hidden />
        <div>
          <h2 className={DASHBOARD_SYNC_HEALTH_TITLE_CLASS}>Carrier sync health</h2>
          <p className={DASHBOARD_SYNC_HEALTH_SUBTITLE_CLASS}>
            Live carrier lines in your scope by sync state
          </p>
        </div>
      </div>

      {callout ? (
        <p className="mt-3 flex items-start gap-1.5 rounded-lg border border-amber-200/80 bg-amber-50/80 px-2.5 py-2 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {callout}
        </p>
      ) : null}

      <div className="mt-4 space-y-3">
        {rows.map((row) => {
          const pct =
            metrics.totalMine === 0 ? 0 : Math.round((row.count / Math.max(1, metrics.totalMine)) * 100);
          return (
            <div key={row.key}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-zinc-600 dark:text-zinc-300">{row.label}</span>
                <span className="tabular-nums text-zinc-500 dark:text-zinc-400">{row.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className={`h-2 rounded-full transition-all ${row.barClass}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <Link href="/shipments" className={DASHBOARD_SYNC_HEALTH_LINK_CLASS}>
        Browse shipments
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </section>
  );
}
