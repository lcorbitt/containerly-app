/**
 * DTOs for the shipment portal API (`get-shipment`, `preview-customer-shipment`).
 *
 * These types define the HTTP contract between the Edge Functions and the frontend.
 * They are the single source of truth — both sides import from here.
 */

// ---------------------------------------------------------------------------
// Report meta / org
// ---------------------------------------------------------------------------

export type ReportMeta = {
  id: string;
  title: string | null;
  created_at: string;
  expires_at: string | null;
};

export type ReportOrganization = {
  name: string;
  slug: string;
} | null;

// ---------------------------------------------------------------------------
// Container lines (multi-container shipments)
// ---------------------------------------------------------------------------

export type ContainerLine = {
  id: string;
  container_number: string;
  carrier: string | null;
  status: string | null;
  last_synced_at: string | null;
  tracking_request_status: string | null;
  last_known_location: unknown;
};

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

export type ReportSummary = {
  shipment_reference?: string;
  container_number: string;
  container_count?: number;
  carrier: string | null;
  status: string | null;
  last_known_location: unknown;
  tracking_request_status: string;
  last_updated_at: string | null;
  freshness_minutes: number | null;
  shipment_context?: Record<string, unknown> | null;
  customer_note?: string | null;
};

export type ReportInsights = {
  risk_level: "low" | "medium" | "high";
  headline: string;
};

// ---------------------------------------------------------------------------
// Timeline / alerts / messages / attachments
// ---------------------------------------------------------------------------

export type TimelineEvent = {
  id: string;
  event_type: string;
  status: string | null;
  location: Record<string, unknown> | null;
  occurred_at: string;
  created_at?: string | null;
  container_id?: string | null;
  tracking_request_id?: string | null;
  raw_payload?: Record<string, unknown> | null;
};

export type Alert = {
  id: string;
  alert_type: string;
  severity: string;
  message: string;
  created_at: string;
};

export type ThreadMessage = {
  id: string;
  body: string;
  author_kind: string;
  author_display_name: string | null;
  parent_message_id: string | null;
  created_at: string;
  container_id?: string | null;
  shipment_id?: string | null;
  container_number?: string | null;
  scope?: "container" | "shipment";
  is_internal?: boolean;
};

export type PortalAttachment = {
  id: string;
  file_name: string;
  content_type: string | null;
  file_size_bytes: number | null;
  created_at: string;
  container_id?: string | null;
  shipment_id?: string | null;
  container_number?: string | null;
  scope?: "container" | "shipment";
  report_message_id: string | null;
  storage_path: string;
};

export type ShipmentAccessMeta = {
  id: string;
  configuration_reminder_due_at: string | null;
  profile_completed_at: string | null;
};

export type LogisticsHints = {
  ais_vs_carrier_eta_hours: number;
  note: string;
};

// ---------------------------------------------------------------------------
// Full portal payload (response of `get-shipment` / `preview-customer-shipment`)
// ---------------------------------------------------------------------------

export type ShipmentPortalPayload = {
  report: ReportMeta;
  organization: ReportOrganization;
  summary: ReportSummary;
  container_lines?: ContainerLine[];
  shipment_id?: string;
  primary_container_id?: string;
  insights: ReportInsights;
  timeline: TimelineEvent[];
  alerts: Alert[];
  messages: ThreadMessage[];
  attachments?: PortalAttachment[];
  raw_external?: Record<string, unknown>;
  enrichment?: Record<string, unknown> | null;
  logistics_hints?: LogisticsHints | null;
  tracking_request_id?: string;
  shipment_access?: ShipmentAccessMeta;
  viewer?: "operator" | "importer";
  /** True when payload was built for an operator preview (not persisted). */
  preview?: boolean;
};
