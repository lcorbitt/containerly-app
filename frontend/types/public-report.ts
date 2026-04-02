/** Payload from Edge Function `get-public-report` (customer-safe). */
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

export type PublicReportSummary = {
  container_number: string;
  carrier: string | null;
  status: string | null;
  last_known_location: unknown;
  tracking_request_status: string;
  last_updated_at: string | null;
  freshness_minutes: number | null;
  /** Enriched JSON Cargo–shaped fields from `containers.location` (customer-safe). */
  shipment_context?: Record<string, unknown> | null;
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
  created_at: string;
};

export type PublicReportPayload = {
  report: PublicReportMeta;
  organization: PublicReportOrg;
  summary: PublicReportSummary;
  insights: PublicReportInsights;
  timeline: PublicTimelineEvent[];
  alerts: PublicAlert[];
  messages: PublicThreadMessage[];
  raw_external?: Record<string, unknown>;
};
