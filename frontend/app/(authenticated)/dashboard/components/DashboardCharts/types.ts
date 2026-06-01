import type { DayCount, OrgDashboardMetrics, PersonalMetrics, TriageBucketKey } from "@/utils/dashboard-metrics";

export interface DashboardChartsProps {
  isAdminView: boolean;
  personalMetrics: PersonalMetrics | null;
  orgMetrics: OrgDashboardMetrics | null | undefined;
}

export interface ChartBarItem {
  key: string;
  label: string;
  value: number;
}

export interface TrendPoint {
  label: string;
  count: number;
}

export interface DashboardChartsData {
  trendPoints: TrendPoint[];
  trendTitle: string;
  distributionItems: ChartBarItem[];
  distributionTitle: string;
}
