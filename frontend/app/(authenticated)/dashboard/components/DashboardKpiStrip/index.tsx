"use client";

import { Loader2 } from "lucide-react";
import {
  DASHBOARD_KPI_CELL_CLASS,
  DASHBOARD_KPI_GRID_CLASS,
  DASHBOARD_KPI_LABEL_CLASS,
  DASHBOARD_KPI_LOADING_CLASS,
  DASHBOARD_KPI_PANEL_CLASS,
  DASHBOARD_KPI_SUB_CLASS,
  DASHBOARD_KPI_VALUE_CLASS,
  DASHBOARD_PANEL_BODY_CLASS,
  dashboardKpiValueToneClass,
} from "./constants";
import type { DashboardKpiStripProps, KpiCardItem } from "./types";
import { buildAdminKpiItems, buildPersonalKpiItems } from "./utils";

function KpiCell({ item }: { item: KpiCardItem }) {
  return (
    <div className={DASHBOARD_KPI_CELL_CLASS}>
      <p className={DASHBOARD_KPI_LABEL_CLASS}>{item.label}</p>
      <p className={`${DASHBOARD_KPI_VALUE_CLASS} ${dashboardKpiValueToneClass(item.tone)}`}>
        {item.value}
      </p>
      <p className={DASHBOARD_KPI_SUB_CLASS}>{item.sub}</p>
    </div>
  );
}

export function DashboardKpiStrip({
  isAdminView,
  orgMetrics,
  personalMetrics,
  loading,
}: DashboardKpiStripProps) {
  if (loading) {
    return (
      <div className={DASHBOARD_KPI_PANEL_CLASS}>
        <div className={DASHBOARD_PANEL_BODY_CLASS}>
          <div className={DASHBOARD_KPI_LOADING_CLASS}>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            <span>Loading metrics…</span>
          </div>
        </div>
      </div>
    );
  }

  if (isAdminView && orgMetrics) {
    return (
      <div className={DASHBOARD_KPI_PANEL_CLASS}>
        <div className={DASHBOARD_KPI_GRID_CLASS}>
          {buildAdminKpiItems(orgMetrics).map((item) => (
            <KpiCell key={item.label} item={item} />
          ))}
        </div>
      </div>
    );
  }

  if (!personalMetrics) {
    return (
      <div className={DASHBOARD_KPI_PANEL_CLASS}>
        <div className={DASHBOARD_PANEL_BODY_CLASS}>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Sign in to see your workload metrics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={DASHBOARD_KPI_PANEL_CLASS}>
      <div className={DASHBOARD_KPI_GRID_CLASS}>
        {buildPersonalKpiItems(personalMetrics).map((item) => (
          <KpiCell key={item.label} item={item} />
        ))}
      </div>
    </div>
  );
}
