"use client";

import {
  DASHBOARD_KPI_CARD_BASE_CLASS,
  DASHBOARD_KPI_GRID_CLASS,
  DASHBOARD_KPI_LABEL_CLASS,
  DASHBOARD_KPI_SUB_CLASS,
  DASHBOARD_KPI_VALUE_CLASS,
  dashboardKpiCardRingClass,
} from "./constants";
import type { DashboardKpiStripProps, KpiCardItem } from "./types";
import { buildAdminKpiItems, buildPersonalKpiItems } from "./utils";

function KpiCard({ item }: { item: KpiCardItem }) {
  return (
    <div className={`${DASHBOARD_KPI_CARD_BASE_CLASS} ${dashboardKpiCardRingClass(item.tone)}`}>
      <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">{item.icon}</div>
      <p className={`mt-2 ${DASHBOARD_KPI_LABEL_CLASS}`}>{item.label}</p>
      <p className={DASHBOARD_KPI_VALUE_CLASS}>{item.value}</p>
      <p className={DASHBOARD_KPI_SUB_CLASS}>{item.sub}</p>
    </div>
  );
}

export function DashboardKpiStrip({ isAdminView, orgMetrics, personalMetrics }: DashboardKpiStripProps) {
  if (isAdminView && orgMetrics) {
    return (
      <div className={DASHBOARD_KPI_GRID_CLASS}>
        {buildAdminKpiItems(orgMetrics).map((item) => (
          <KpiCard key={item.label} item={item} />
        ))}
      </div>
    );
  }

  if (!personalMetrics) {
    return (
      <div className={DASHBOARD_KPI_CARD_BASE_CLASS}>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Sign in to see your workload metrics.</p>
      </div>
    );
  }

  return (
    <div className={DASHBOARD_KPI_GRID_CLASS}>
      {buildPersonalKpiItems(personalMetrics).map((item) => (
        <KpiCard key={item.label} item={item} />
      ))}
    </div>
  );
}
