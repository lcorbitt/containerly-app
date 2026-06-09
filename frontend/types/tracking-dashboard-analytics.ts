import type { DashboardInsightsMetrics } from "@/utils/dashboard-insights";
import type { OrgDashboardMetrics } from "@/utils/dashboard-metrics";
import type { PerformanceInsights } from "@shared/dto/performance.dto";

/** Lazy-loaded dashboard analytics (insights grid or reports tab). */
export interface TrackingDashboardInsightsBundle {
  orgInsights: DashboardInsightsMetrics;
}

export interface TrackingDashboardReportsBundle {
  orgMetrics: OrgDashboardMetrics;
  performanceInsights: PerformanceInsights;
}
