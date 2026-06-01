import type { ReactNode } from "react";
import type { OrgDashboardMetrics, PersonalMetrics } from "@/utils/dashboard-metrics";

export interface DashboardKpiStripProps {
  isAdminView: boolean;
  orgMetrics: OrgDashboardMetrics | null | undefined;
  personalMetrics: PersonalMetrics | null;
}

export interface KpiCardItem {
  icon: ReactNode;
  label: string;
  value: number;
  sub: string;
  tone: "neutral" | "warn" | "bad" | "good";
}
