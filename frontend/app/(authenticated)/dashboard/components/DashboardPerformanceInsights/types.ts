import type { PerformanceInsights } from "@shared/dto/performance.dto";

export interface DashboardPerformanceInsightsProps {
  insights: PerformanceInsights | null | undefined;
  loading?: boolean;
}
