import type { DashboardInsightsMetrics } from "@/utils/dashboard-insights";

export interface DashboardTimeToResolveChartProps {
  series: DashboardInsightsMetrics["timeToResolveSeries"];
  loading?: boolean;
}

export interface TimeToResolveChartPoint {
  label: string;
  alertAckMedianHours: number | null;
  replyMedianHours: number | null;
}
