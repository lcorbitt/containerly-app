import type { PersonalMetrics } from "@/utils/dashboard-metrics";
import type { TriageBucket } from "@/utils/dashboard-metrics";
import type { ShipmentMessageThreadSummary } from "@/types/workspace-load";
import type { TrackingDashboardSnapshot } from "@/types/tracking-dashboard-snapshot";

export interface UseTrackingDashboardResult {
  selectedOrgName: string | null;
  isAdminView: boolean;
  loading: boolean;
  isError: boolean;
  snapshot: TrackingDashboardSnapshot | undefined;
  personalMetrics: PersonalMetrics | null;
  triageBuckets: TriageBucket[];
  messageThreads: ShipmentMessageThreadSummary[];
  messagesLoading: boolean;
}
