"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import {
  DASHBOARD_ALERTS_LIST_CLASS,
  DASHBOARD_ALERTS_LOADING_CLASS,
  DASHBOARD_ALERTS_MAX_ROWS,
  DASHBOARD_ALERTS_PANEL_CLASS,
  DASHBOARD_ALERTS_PANEL_BODY_CLASS,
  DASHBOARD_ALERTS_ROW_CLASS,
  DASHBOARD_ALERTS_TAG_CLASS,
  DASHBOARD_ALERTS_TAG_CRITICAL_CLASS,
  DASHBOARD_ALERTS_TAG_INFO_CLASS,
  DASHBOARD_ALERTS_TAG_WARNING_CLASS,
  DASHBOARD_SECTION_DESC_CLASS,
  DASHBOARD_SECTION_TITLE_CLASS,
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
        <div className={DASHBOARD_ALERTS_PANEL_BODY_CLASS}>
          <h2 className={DASHBOARD_SECTION_TITLE_CLASS}>Action items</h2>
          <div className={DASHBOARD_ALERTS_LOADING_CLASS}>
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
            <span>Loading…</span>
          </div>
        </div>
      </section>
    );
  }

  if (!userId) {
    return (
      <section className={DASHBOARD_ALERTS_PANEL_CLASS}>
        <div className={DASHBOARD_ALERTS_PANEL_BODY_CLASS}>
          <h2 className={DASHBOARD_SECTION_TITLE_CLASS}>Action items</h2>
          <p className="mt-4 text-sm text-zinc-500">Sign in to see what needs your attention.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={DASHBOARD_ALERTS_PANEL_CLASS} aria-labelledby="dashboard-alerts-heading">
      <div className={DASHBOARD_ALERTS_PANEL_BODY_CLASS}>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 id="dashboard-alerts-heading" className={DASHBOARD_SECTION_TITLE_CLASS}>
              Action items
            </h2>
            <p className={DASHBOARD_SECTION_DESC_CLASS}>
              {isAdminView
                ? "Your personal triage queue."
                : "Shipments you own, are assigned to, or collaborate on."}
            </p>
          </div>
          {items.length === 0 ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              All clear
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
              {items.length} {items.length === 1 ? "item" : "items"}
            </span>
          )}
        </div>

        {visible.length === 0 ? (
          <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
            Nothing needs your attention right now.
          </p>
        ) : (
          <ul className={`mt-5 ${DASHBOARD_ALERTS_LIST_CLASS}`}>
            {visible.map((item, index) => (
              <li key={`${item.containerId}-${item.bucketKey}-${index}`}>
                <Link href={`/containers/${item.containerId}`} className={DASHBOARD_ALERTS_ROW_CLASS}>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="font-mono text-sm font-medium text-zinc-900 group-hover:text-primary-orange dark:text-zinc-100">
                        {item.containerNumber}
                      </span>
                      <span className="text-xs text-zinc-400 dark:text-zinc-500">{item.bucketLabel}</span>
                    </div>
                    <p className="mt-1 text-sm leading-snug text-zinc-600 dark:text-zinc-400">{item.detail}</p>
                  </div>
                  <span className={`${DASHBOARD_ALERTS_TAG_CLASS} ${tagClass(item.severity)}`}>
                    {item.tagLabel}
                  </span>
                </Link>
              </li>
            ))}
            {items.length > DASHBOARD_ALERTS_MAX_ROWS ? (
              <li className="pt-3 text-center text-xs text-zinc-400 dark:text-zinc-500">
                +{items.length - DASHBOARD_ALERTS_MAX_ROWS} more in triage
              </li>
            ) : null}
          </ul>
        )}
      </div>
    </section>
  );
}
