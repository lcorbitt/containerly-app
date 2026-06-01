import type { Alert, Container, ReportMessage, TrackingRequest } from "@/types/database";
import type { OrgDashboardMetrics, SpotlightShipment, TriageBucketKey } from "@/utils/dashboard-metrics";

export type { OrgDashboardMetrics, SpotlightShipment, TriageBucketKey };

/** Dashboard bundle built on the server; safe to import from browser services for typing only. */
export type TrackingDashboardSnapshot = {
  currentUserId: string | null;
  requests: TrackingRequest[];
  alerts: Alert[];
  triageContainersById: Record<string, Pick<Container, "id" | "status" | "location" | "shipment_id">>;
  triageAttachmentCounts: Record<string, number>;
  triageMessages: ReportMessage[];
  participatingShipmentIds: string[];
  shipmentOwnerByShipmentId: Record<string, string | null>;
  shipmentAssigneeByShipmentId: Record<string, string | null>;
  /** Present when caller is org admin or platform superadmin. */
  orgMetrics?: OrgDashboardMetrics;
  /** Highest-priority personal triage item with commercial route fields. */
  spotlightShipment?: SpotlightShipment | null;
};
