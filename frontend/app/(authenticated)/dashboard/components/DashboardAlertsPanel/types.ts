import type { TriageBucketKey } from "@/utils/dashboard-metrics";

export interface DashboardAlertsPanelProps {
  loading?: boolean;
  userId: string | null;
  buckets: import("@/utils/dashboard-metrics").TriageBucket[];
  isAdminView: boolean;
}

export interface AlertListItem {
  containerId: string;
  containerNumber: string;
  detail: string;
  bucketKey: TriageBucketKey;
  bucketLabel: string;
  tagLabel: string;
  severity: "critical" | "warning" | "info";
}
