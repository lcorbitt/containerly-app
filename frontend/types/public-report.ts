/** Payload from Edge Function `get-public-report` (importer-facing / redacted). */
export type PublicReportMeta = {
  id: string;
  title: string | null;
  created_at: string;
  expires_at: string | null;
};

export type PublicReportOrg = {
  name: string;
  slug: string;
} | null;

export type PublicReportContainerLine = {
  id: string;
  container_number: string;
  carrier: string | null;
  status: string | null;
  last_synced_at: string | null;
  tracking_request_status: string | null;
  last_known_location: unknown;
};

export type PublicReportSummary = {
  /** Commercial shipment title when payload is shipment-scoped. */
  shipment_reference?: string;
  container_number: string;
  /** Number of physical units on the shipment (multi-container grants). */
  container_count?: number;
  carrier: string | null;
  status: string | null;
  last_known_location: unknown;
  tracking_request_status: string;
  last_updated_at: string | null;
  freshness_minutes: number | null;
  /** Enriched JSON Cargo–shaped fields from `containers.location` (visibility-filtered). */
  shipment_context?: Record<string, unknown> | null;
  /** Operator-curated note merged into importer portal view. */
  customer_note?: string | null;
};

export type PublicReportInsights = {
  risk_level: "low" | "medium" | "high";
  headline: string;
};

export type PublicTimelineEvent = {
  id: string;
  event_type: string;
  status: string | null;
  location: Record<string, unknown> | null;
  occurred_at: string;
  /** Set when loaded from org `tracking_events` (not on public report). */
  created_at?: string | null;
  container_id?: string | null;
  tracking_request_id?: string | null;
  raw_payload?: Record<string, unknown> | null;
};

export type PublicAlert = {
  id: string;
  alert_type: string;
  severity: string;
  message: string;
  created_at: string;
};

export type PublicThreadMessage = {
  id: string;
  body: string;
  author_kind: string;
  author_display_name: string | null;
  parent_message_id: string | null;
  created_at: string;
  container_id?: string | null;
  shipment_id?: string | null;
  container_number?: string | null;
  /** Derived in API: whole-shipment thread vs per-container. */
  scope?: "container" | "shipment";
  /** Present on operator shipment portal (internal thread). */
  is_internal?: boolean;
};

export type PublicPortalAttachment = {
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

/** When AIS-derived ETA and carrier ETA diverge meaningfully. */
export type PublicLogisticsHints = {
  ais_vs_carrier_eta_hours: number;
  note: string;
};

export type PublicReportPayload = {
  report: PublicReportMeta;
  organization: PublicReportOrg;
  summary: PublicReportSummary;
  /** Per-container snapshot when shipment has multiple units. */
  container_lines?: PublicReportContainerLine[];
  shipment_id?: string;
  primary_container_id?: string;
  insights: PublicReportInsights;
  timeline: PublicTimelineEvent[];
  alerts: PublicAlert[];
  messages: PublicThreadMessage[];
  attachments?: PublicPortalAttachment[];
  raw_external?: Record<string, unknown>;
  /** Vessel AIS / specs from `containers.enrichment` when visibility allows. */
  enrichment?: Record<string, unknown> | null;
  logistics_hints?: PublicLogisticsHints | null;
  /** Present for authenticated shipment API (legacy clients). */
  tracking_request_id?: string;
  shipment_access?: ShipmentAccessMeta;
  /** Who is viewing: freight org (full portal) vs importer grant. */
  viewer?: "operator" | "importer";
};
