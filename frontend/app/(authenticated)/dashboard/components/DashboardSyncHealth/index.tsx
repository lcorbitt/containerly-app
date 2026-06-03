"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import {
  DASHBOARD_SYNC_HEALTH_BAR_FILL_CLASS,
  DASHBOARD_SYNC_HEALTH_BAR_TRACK_CLASS,
  DASHBOARD_SYNC_HEALTH_CALLOUT_CLASS,
  DASHBOARD_SYNC_HEALTH_LINK_CLASS,
  DASHBOARD_SYNC_HEALTH_LOADING_CLASS,
  DASHBOARD_SYNC_HEALTH_PANEL_BODY_CLASS,
  DASHBOARD_SYNC_HEALTH_PANEL_CLASS,
  DASHBOARD_SYNC_HEALTH_ROW_LABEL_CLASS,
  DASHBOARD_SYNC_HEALTH_ROW_VALUE_CLASS,
  DASHBOARD_SYNC_HEALTH_SUBTITLE_CLASS,
  DASHBOARD_SYNC_HEALTH_TITLE_CLASS,
} from "./constants";
import type { DashboardSyncHealthProps } from "./types";
import { buildSyncHealthRows, syncHealthCallout } from "./utils";

export function DashboardSyncHealth({ metrics, loading }: DashboardSyncHealthProps) {
  if (loading) {
    return (
      <section className={DASHBOARD_SYNC_HEALTH_PANEL_CLASS} aria-busy="true">
        <div className={DASHBOARD_SYNC_HEALTH_PANEL_BODY_CLASS}>
          <h2 className={DASHBOARD_SYNC_HEALTH_TITLE_CLASS}>Carrier sync</h2>
          <div className={DASHBOARD_SYNC_HEALTH_LOADING_CLASS}>
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
            <span>Loading…</span>
          </div>
        </div>
      </section>
    );
  }

  if (!metrics) {
    return (
      <section className={DASHBOARD_SYNC_HEALTH_PANEL_CLASS}>
        <div className={DASHBOARD_SYNC_HEALTH_PANEL_BODY_CLASS}>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Sign in to see carrier sync health.</p>
        </div>
      </section>
    );
  }

  const rows = buildSyncHealthRows(metrics);
  const callout = syncHealthCallout(metrics);

  return (
    <section className={DASHBOARD_SYNC_HEALTH_PANEL_CLASS}>
      <div className={`${DASHBOARD_SYNC_HEALTH_PANEL_BODY_CLASS} flex h-full flex-col`}>
        <div>
          <h2 className={DASHBOARD_SYNC_HEALTH_TITLE_CLASS}>Carrier sync</h2>
          <p className={DASHBOARD_SYNC_HEALTH_SUBTITLE_CLASS}>
            Live carrier lines in your scope
          </p>
        </div>

        {callout ? (
          <p className={DASHBOARD_SYNC_HEALTH_CALLOUT_CLASS}>
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            {callout}
          </p>
        ) : null}

        <div className="mt-3 space-y-3">
          {rows.map((row) => {
            const pct =
              metrics.totalMine === 0 ? 0 : Math.round((row.count / Math.max(1, metrics.totalMine)) * 100);
            return (
              <div key={row.key}>
                <div className="mb-1.5 flex justify-between">
                  <span className={DASHBOARD_SYNC_HEALTH_ROW_LABEL_CLASS}>{row.label}</span>
                  <span className={DASHBOARD_SYNC_HEALTH_ROW_VALUE_CLASS}>{row.count}</span>
                </div>
                <div className={DASHBOARD_SYNC_HEALTH_BAR_TRACK_CLASS}>
                  <div
                    className={`${DASHBOARD_SYNC_HEALTH_BAR_FILL_CLASS} ${row.barClass}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <Link href="/shipments" className={`${DASHBOARD_SYNC_HEALTH_LINK_CLASS} mt-auto pt-4`}>
          Browse shipments
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
