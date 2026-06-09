import type { DashboardInsightsMetrics } from "@/utils/dashboard-insights";

export interface DashboardInsightsGridProps {
  orgInsights: DashboardInsightsMetrics | undefined;
  loading?: boolean;
}
