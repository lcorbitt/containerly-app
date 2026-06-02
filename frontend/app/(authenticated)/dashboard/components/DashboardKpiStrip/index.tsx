"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Layers,
  Package,
  Radio,
  UserCheck,
} from "lucide-react";
import {
  DASHBOARD_KPI_CARD_BASE_CLASS,
  DASHBOARD_KPI_GRID_CLASS,
  DASHBOARD_KPI_LABEL_CLASS,
  DASHBOARD_KPI_SUB_CLASS,
  DASHBOARD_KPI_VALUE_CLASS,
  dashboardKpiCardRingClass,
} from "./constants";
import type { DashboardKpiStripProps, KpiCardItem, KpiIconKey } from "./types";
import { buildAdminKpiItems, buildPersonalKpiItems } from "./utils";

function kpiIcon(iconKey: KpiIconKey) {
  switch (iconKey) {
    case "package":
      return <Package className="h-4 w-4" />;
    case "layers":
      return <Layers className="h-4 w-4" />;
    case "alert":
      return <AlertTriangle className="h-4 w-4" />;
    case "check":
      return <CheckCircle2 className="h-4 w-4" />;
    case "radio":
      return <Radio className="h-4 w-4" />;
    case "user":
      return <UserCheck className="h-4 w-4" />;
  }
}

function KpiCard({ item }: { item: KpiCardItem }) {
  return (
    <div className={`${DASHBOARD_KPI_CARD_BASE_CLASS} ${dashboardKpiCardRingClass(item.tone)}`}>
      <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">{kpiIcon(item.iconKey)}</div>
      <p className={`mt-2 ${DASHBOARD_KPI_LABEL_CLASS}`}>{item.label}</p>
      <p className={DASHBOARD_KPI_VALUE_CLASS}>{item.value}</p>
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
      <div className={DASHBOARD_KPI_CARD_BASE_CLASS}>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading metrics...</p>
      </div>
    );
  }

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
