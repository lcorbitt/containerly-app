import type { Alert, Container, ReportMessage, TrackingRequest } from "@/types/database";
import type {
  OrgDashboardMetrics,
  SpotlightShipment,
  TriageActionContext,
  TriageBucketKey,
} from "@/utils/dashboard-metrics";
import type { PerformanceInsights } from "@shared/dto/performance.dto";

export type {
  OrgDashboardMetrics,
  SpotlightShipment,
  TriageActionContext,
  TriageBucketKey,
  PerformanceInsights,
};

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
  /** Org-level performance insights (admin view). */
  performanceInsights?: PerformanceInsights;
  /** Highest-priority personal triage item with commercial route fields. */
  spotlightShipment?: SpotlightShipment | null;
  /** Commercial + sync context for each container in the personal triage queue. */
  triageActionContextByContainerId?: Record<string, TriageActionContext>;
};
