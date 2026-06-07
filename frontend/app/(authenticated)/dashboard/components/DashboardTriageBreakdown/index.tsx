"use client";

import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import {
  DASHBOARD_TRIAGE_BREAKDOWN_BAR_FILL_CLASS,
  DASHBOARD_TRIAGE_BREAKDOWN_BAR_TRACK_CLASS,
  DASHBOARD_TRIAGE_BREAKDOWN_EYEBROW_CLASS,
  DASHBOARD_TRIAGE_BREAKDOWN_LINK_CLASS,
  DASHBOARD_TRIAGE_BREAKDOWN_LIST_CLASS,
  DASHBOARD_TRIAGE_BREAKDOWN_PANEL_BODY_CLASS,
  DASHBOARD_TRIAGE_BREAKDOWN_PANEL_CLASS,
  DASHBOARD_TRIAGE_BREAKDOWN_ROW_LABEL_CLASS,
  DASHBOARD_TRIAGE_BREAKDOWN_ROW_VALUE_CLASS,
  DASHBOARD_TRIAGE_BREAKDOWN_TITLE_CLASS,
} from "./constants";
import type { DashboardTriageBreakdownProps } from "./types";
import {
  buildTriageBreakdownRows,
  resolveTriageBreakdownCounts,
  triageBreakdownTotal,
} from "./utils";

export function DashboardTriageBreakdown({
  loading = false,
  isAdminView,
  orgTriageCounts,
  buckets = [],
}: DashboardTriageBreakdownProps) {
  if (loading) {
    return (
      <section className={DASHBOARD_TRIAGE_BREAKDOWN_PANEL_CLASS} aria-busy="true">
        <div className={DASHBOARD_TRIAGE_BREAKDOWN_PANEL_BODY_CLASS}>
          <p className={DASHBOARD_TRIAGE_BREAKDOWN_EYEBROW_CLASS}>Queue</p>
          <h2 className={DASHBOARD_TRIAGE_BREAKDOWN_TITLE_CLASS}>Triage breakdown</h2>
          <div className="flex flex-1 items-center justify-center gap-2 text-sm text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            <span>Loading…</span>
          </div>
        </div>
      </section>
    );
  }

  const counts = resolveTriageBreakdownCounts({ isAdminView, orgTriageCounts, buckets });
  const rows = buildTriageBreakdownRows(counts);
  const total = triageBreakdownTotal(counts);

  return (
    <section className={DASHBOARD_TRIAGE_BREAKDOWN_PANEL_CLASS} aria-labelledby="dashboard-triage-breakdown-heading">
      <div className={DASHBOARD_TRIAGE_BREAKDOWN_PANEL_BODY_CLASS}>
        <p className={DASHBOARD_TRIAGE_BREAKDOWN_EYEBROW_CLASS}>Queue</p>
        <h2 id="dashboard-triage-breakdown-heading" className={DASHBOARD_TRIAGE_BREAKDOWN_TITLE_CLASS}>
          Triage breakdown
        </h2>

        {total === 0 ? (
          <p className="mt-4 flex flex-1 items-center text-sm text-zinc-500 dark:text-zinc-400">
            No open triage items.
          </p>
        ) : (
          <ul className={DASHBOARD_TRIAGE_BREAKDOWN_LIST_CLASS}>
            {rows.map((row) => {
              const pct = total === 0 ? 0 : Math.round((row.count / total) * 100);
              return (
                <li key={row.key}>
                  <div className="mb-1 flex justify-between gap-2">
                    <span className={DASHBOARD_TRIAGE_BREAKDOWN_ROW_LABEL_CLASS}>{row.label}</span>
                    <span className={DASHBOARD_TRIAGE_BREAKDOWN_ROW_VALUE_CLASS}>{row.count}</span>
                  </div>
                  <div className={DASHBOARD_TRIAGE_BREAKDOWN_BAR_TRACK_CLASS}>
                    <div
                      className={`${DASHBOARD_TRIAGE_BREAKDOWN_BAR_FILL_CLASS} ${row.barClass}`}
                      style={{ width: `${row.count === 0 ? 0 : Math.max(pct, 4)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <Link href="/shipments" className={`${DASHBOARD_TRIAGE_BREAKDOWN_LINK_CLASS} mt-auto pt-4`}>
          View Shipments
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
