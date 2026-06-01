/**
 * Export document types for shipment attachments.
 */
export const SHIPMENT_DOCUMENT_TYPES = [
  "Beneficiary Certificate",
  "Canadian Customs Invoice",
  "Certificate of Free Sale",
  "Commercial Invoice",
  "Cover Letter",
  "Certificate of Origin",
  "Certificate of Analysis",
  "Certificate of Quality",
  "Certificate of Wholesomeness",
  "Delivery Manifest",
  "Export Declaration",
  "EU Transit Certificate",
  "Health Certificate",
  "Inland Bill of Lading",
  "Insurance Certificate",
  "Letter of Credit",
  "Manufacturers Declaration",
  "No Wood Declaration",
  "Ocean Bill of Lading",
  "Packaging Declaration",
  "Packing List",
  "Quarantine Declaration",
  "Slaughter Certificate",
  "Sight Draft",
  "Shelf Life Report",
  "Seaway Bill",
  "Written Authorization to prepare Transmit",
  "Weight List",
] as const;

export type ShipmentDocumentType = (typeof SHIPMENT_DOCUMENT_TYPES)[number];

/** Shipment document workflow statuses (DB enum `shipment_workflow_status`). */
export const SHIPMENT_WORKFLOW_STATUSES = [
  "pending_drafts",
  "awaiting_review",
  "approved",
  "rejected",
  "originals_sent",
] as const;

export type ShipmentWorkflowStatus = (typeof SHIPMENT_WORKFLOW_STATUSES)[number];

export type DocumentGroup = "draft" | "revision" | "original";

export type DocumentApprovalStatus = "pending" | "approved" | "rejected";

export type ShipmentLineInput = {
  id?: string;
  container_id?: string | null;
  container_number?: string | null;
  order_number?: string | null;
  carrier_booking_number?: string | null;
  customer_name?: string | null;
  country?: string | null;
  port_of_loading?: string | null;
  port_of_destination?: string | null;
  estimated_departure_at?: string | null;
  estimated_arrival_at?: string | null;
  freight_booking_carrier?: string | null;
  vessel?: string | null;
  voyage?: string | null;
  health_certificate_no?: string | null;
  trade_terms?: string | null;
  sort_order?: number;
};

export type ShipmentCommercialHeader = {
  order_number: string;
  carrier_booking_number: string;
  container_number: string;
  customer_name?: string | null;
  country?: string | null;
  port_of_loading?: string | null;
  port_of_destination?: string | null;
  estimated_departure_at?: string | null;
  estimated_arrival_at?: string | null;
  freight_booking_carrier?: string | null;
  vessel?: string | null;
  voyage?: string | null;
  health_certificate_no?: string | null;
  trade_terms?: string | null;
  bill_of_lading?: string | null;
  shipping_line?: string | null;
};

export type CreateShipmentBody = {
  organization_id: string;
  header: ShipmentCommercialHeader;
  lines: ShipmentLineInput[];
};

export type CreateShipmentResponse = {
  shipment_id: string;
  line_ids: string[];
};

export type UpdateShipmentBody = {
  organization_id: string;
  shipment_id: string;
  header?: Partial<ShipmentCommercialHeader>;
  lines?: ShipmentLineInput[];
  physical_mail_tracking_number?: string | null;
  workflow_status?: ShipmentWorkflowStatus;
};

export type UpdateShipmentResponse = {
  shipment_id: string;
  line_ids: string[];
};

/** Used by Edge `delete-shipment`. */
export type DeleteShipmentBody = {
  organization_id: string;
  shipment_id: string;
};

export type DeleteShipmentResponse = {
  shipment_id: string;
};

export type ShipmentLineDto = {
  id: string;
  shipment_id: string;
  container_id: string | null;
  container_number: string | null;
  order_number: string | null;
  carrier_booking_number: string | null;
  customer_name: string | null;
  country: string | null;
  port_of_loading: string | null;
  port_of_destination: string | null;
  estimated_departure_at: string | null;
  estimated_arrival_at: string | null;
  freight_booking_carrier: string | null;
  vessel: string | null;
  voyage: string | null;
  health_certificate_no: string | null;
  trade_terms: string | null;
  sort_order: number;
};

export type ShipmentCommercialDetails = {
  customer_name: string | null;
  country: string | null;
  port_of_loading: string | null;
  port_of_destination: string | null;
  estimated_departure_at: string | null;
  estimated_arrival_at: string | null;
  freight_booking_carrier: string | null;
  vessel: string | null;
  voyage: string | null;
  health_certificate_no: string | null;
  trade_terms: string | null;
  physical_mail_tracking_number: string | null;
  physical_mail_sent_at: string | null;
  workflow_status: ShipmentWorkflowStatus;
  lines: ShipmentLineDto[];
};

export type ReviewShipmentDocumentBody = {
  attachment_id: string;
  shipment_id: string;
  action: "approve" | "reject";
  rejection_reason?: string;
};

export type ReviewShipmentDocumentResponse = {
  attachment_id: string;
  approval_status: DocumentApprovalStatus;
  workflow_status: ShipmentWorkflowStatus;
};

export type ShipmentActivityEventDto = {
  id: string;
  event_type: string;
  body: string;
  actor_kind: string;
  occurred_at: string;
  metadata: Record<string, unknown>;
};
