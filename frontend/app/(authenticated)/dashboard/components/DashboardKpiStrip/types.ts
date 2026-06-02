import type { OrgDashboardMetrics, PersonalMetrics } from "@/utils/dashboard-metrics";

export interface DashboardKpiStripProps {
  isAdminView: boolean;
  orgMetrics: OrgDashboardMetrics | null | undefined;
  personalMetrics: PersonalMetrics | null;
  loading?: boolean;
}

export type KpiIconKey = "package" | "layers" | "alert" | "check" | "radio" | "user";

export interface KpiCardItem {
  iconKey: KpiIconKey;
  label: string;
  value: number;
  sub: string;
  tone: "neutral" | "warn" | "bad" | "good";
}
