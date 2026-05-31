import type { ShipmentWorkflowStatus } from "@shared/dto/logistics.dto";

const LEGACY_STATUS_MAP: Record<string, ShipmentWorkflowStatus> = {
  draft: "pending_drafts",
  revisions_needed: "rejected",
  mailed: "originals_sent",
  in_transit: "originals_sent",
};

export const SHIPMENT_WORKFLOW_STATUS_LABELS: Record<ShipmentWorkflowStatus, string> = {
  pending_drafts: "Pending Drafts",
  awaiting_review: "Awaiting Review",
  approved: "Approved",
  rejected: "Rejected",
  originals_sent: "Originals Sent",
};

export function normalizeShipmentWorkflowStatus(
  status: string | null | undefined,
): ShipmentWorkflowStatus | null {
  if (!status?.trim()) return null;
  const key = status.toLowerCase().trim();
  return (LEGACY_STATUS_MAP[key] ?? key) as ShipmentWorkflowStatus;
}

export function shipmentWorkflowDisplayLabel(status: string | null | undefined): string {
  const normalized = normalizeShipmentWorkflowStatus(status);
  if (!normalized) return "—";
  return SHIPMENT_WORKFLOW_STATUS_LABELS[normalized] ?? status.replace(/_/g, " ");
}

/** Approved or originals already mailed to customer. */
export function isShipmentPostApproval(status: string | null | undefined): boolean {
  const normalized = normalizeShipmentWorkflowStatus(status);
  return normalized === "approved" || normalized === "originals_sent";
}
