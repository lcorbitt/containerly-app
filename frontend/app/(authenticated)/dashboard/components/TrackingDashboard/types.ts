import type { DashboardInsightsMetrics } from "@/utils/dashboard-insights";
import type { PersonalMetrics, TriageBucket } from "@/utils/dashboard-metrics";
import type { TrackingDashboardSnapshot } from "@/types/tracking-dashboard-snapshot";

export interface UseTrackingDashboardResult {
  selectedOrgName: string | null;
  isAdminView: boolean;
  loading: boolean;
  analyticsLoading: boolean;
  isError: boolean;
  snapshot: TrackingDashboardSnapshot | undefined;
  orgInsights: DashboardInsightsMetrics | undefined;
  personalMetrics: PersonalMetrics | null;
  triageBuckets: TriageBucket[];
}
