import type { Alert, Container, ReportMessage, TrackingRequest } from "@/types/database";

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
};
