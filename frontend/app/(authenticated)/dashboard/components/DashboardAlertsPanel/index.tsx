"use client";

import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import {
  DASHBOARD_ALERTS_MAX_ROWS,
  DASHBOARD_ALERTS_PANEL_CLASS,
  DASHBOARD_ALERTS_ROW_BASE_CLASS,
  DASHBOARD_ALERTS_ROW_CRITICAL_CLASS,
  DASHBOARD_ALERTS_ROW_DEFAULT_CLASS,
  DASHBOARD_ALERTS_TAG_BASE_CLASS,
  DASHBOARD_ALERTS_TAG_CRITICAL_CLASS,
  DASHBOARD_ALERTS_TAG_INFO_CLASS,
  DASHBOARD_ALERTS_TAG_WARNING_CLASS,
} from "./constants";
import type { DashboardAlertsPanelProps } from "./types";
import { buildAlertListItems } from "./utils";

function tagClass(severity: "critical" | "warning" | "info"): string {
  switch (severity) {
    case "critical":
      return DASHBOARD_ALERTS_TAG_CRITICAL_CLASS;
    case "warning":
      return DASHBOARD_ALERTS_TAG_WARNING_CLASS;
    default:
      return DASHBOARD_ALERTS_TAG_INFO_CLASS;
  }
}

export function DashboardAlertsPanel({ loading, userId, buckets, isAdminView }: DashboardAlertsPanelProps) {
  const items = buildAlertListItems(buckets);
  const visible = items.slice(0, DASHBOARD_ALERTS_MAX_ROWS);

  if (loading) {
    return (
      <section className={DASHBOARD_ALERTS_PANEL_CLASS} aria-busy="true" aria-live="polite">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Your action items</h2>
        <div className="mt-6 flex min-h-40 items-center justify-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
          <span>Loading alerts...</span>
        </div>
      </section>
    );
  }

  if (!userId) {
    return (
      <section className={DASHBOARD_ALERTS_PANEL_CLASS}>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Your action items</h2>
        <p className="mt-2 text-sm text-zinc-500">Sign in to see what needs your attention.</p>
      </section>
    );
  }

  return (
    <section className={DASHBOARD_ALERTS_PANEL_CLASS} aria-labelledby="dashboard-alerts-heading">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h2 id="dashboard-alerts-heading" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Your action items
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {isAdminView
              ? "Personal triage queue — org-wide counts are in the KPI strip above."
              : "Shipments you own, are assigned to, or collaborate on."}
          </p>
        </div>
        {items.length === 0 ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            All clear
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Nothing needs your attention right now.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((item, index) => (
            <li key={`${item.containerId}-${item.bucketKey}-${index}`}>
              <Link
                href={`/containers/${item.containerId}`}
                className={`${DASHBOARD_ALERTS_ROW_BASE_CLASS} ${
                  item.severity === "critical"
                    ? DASHBOARD_ALERTS_ROW_CRITICAL_CLASS
                    : DASHBOARD_ALERTS_ROW_DEFAULT_CLASS
                } group block`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-zinc-900 group-hover:underline dark:text-zinc-100">
                      {item.containerNumber}
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{item.bucketLabel}</span>
                  </div>
                  <p className="mt-1 text-xs leading-snug text-zinc-600 dark:text-zinc-400">{item.detail}</p>
                </div>
                <span className={`${DASHBOARD_ALERTS_TAG_BASE_CLASS} ${tagClass(item.severity)}`}>
                  {item.tagLabel}
                </span>
              </Link>
            </li>
          ))}
          {items.length > DASHBOARD_ALERTS_MAX_ROWS ? (
            <li className="text-center text-xs text-zinc-500 dark:text-zinc-400">
              +{items.length - DASHBOARD_ALERTS_MAX_ROWS} more in triage
            </li>
          ) : null}
        </ul>
      )}
    </section>
  );
}
