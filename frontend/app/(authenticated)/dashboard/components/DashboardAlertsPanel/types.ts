import type { TriageActionContext, TriageBucketKey } from "@/utils/dashboard-metrics";

export interface DashboardAlertsPanelProps {
  loading?: boolean;
  userId: string | null;
  buckets: import("@/utils/dashboard-metrics").TriageBucket[];
  actionContextByContainerId?: Record<string, TriageActionContext>;
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
  shipmentId: string | null;
  orderNumber: string | null;
  customerName: string | null;
  routeLine: string | null;
  carrierStatus: string | null;
  containerLocation: string | null;
  trackingStatus: string | null;
  workflowStatus: string | null;
}
