"use client";

import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { DashboardActionItemRow } from "./DashboardActionItemRow";
import {
  DASHBOARD_ALERTS_LIST_CLASS,
  DASHBOARD_ALERTS_LOADING_CLASS,
  DASHBOARD_ALERTS_MAX_ROWS,
  DASHBOARD_ALERTS_MORE_CLASS,
  DASHBOARD_ALERTS_PANEL_BODY_CLASS,
  DASHBOARD_ALERTS_PANEL_CLASS,
  DASHBOARD_SECTION_DESC_CLASS,
  DASHBOARD_SECTION_TITLE_CLASS,
} from "./constants";
import type { DashboardAlertsPanelProps } from "./types";
import { buildAlertListItems } from "./utils";

export function DashboardAlertsPanel({
  loading,
  userId,
  buckets,
  actionContextByContainerId = {},
  isAdminView,
}: DashboardAlertsPanelProps) {
  const items = buildAlertListItems(buckets, actionContextByContainerId);
  const visible = items.slice(0, DASHBOARD_ALERTS_MAX_ROWS);

  if (loading) {
    return (
      <section className={DASHBOARD_ALERTS_PANEL_CLASS} aria-busy="true" aria-live="polite">
        <div className={DASHBOARD_ALERTS_PANEL_BODY_CLASS}>
          <h2 className={DASHBOARD_SECTION_TITLE_CLASS}>Action items</h2>
          <div className={`${DASHBOARD_ALERTS_LOADING_CLASS} flex-1`}>
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
          <p className="mt-4 flex flex-1 items-center text-sm text-zinc-500">
            Sign in to see what needs your attention.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className={DASHBOARD_ALERTS_PANEL_CLASS} aria-labelledby="dashboard-alerts-heading">
      <div className={DASHBOARD_ALERTS_PANEL_BODY_CLASS}>
        <div className="flex shrink-0 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
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
          <p className="mt-6 flex flex-1 items-center text-sm text-zinc-500 dark:text-zinc-400">
            Nothing needs your attention right now.
          </p>
        ) : (
          <ul className={`mt-5 ${DASHBOARD_ALERTS_LIST_CLASS}`}>
            {visible.map((item, index) => (
              <li key={`${item.containerId}-${item.bucketKey}-${index}`}>
                <DashboardActionItemRow item={item} />
              </li>
            ))}
            {items.length > DASHBOARD_ALERTS_MAX_ROWS ? (
              <li className={DASHBOARD_ALERTS_MORE_CLASS}>
                +{items.length - DASHBOARD_ALERTS_MAX_ROWS} more in triage
              </li>
            ) : null}
          </ul>
        )}
      </div>
    </section>
  );
}
