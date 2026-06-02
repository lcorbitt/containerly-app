/**
 * Performance / improvement-engine DTOs shared by dashboard API and Edge.
 */

import type { TriageBucketKey } from "./performance.types.ts";

export type DelayCarrierInsight = {
  carrier_key: string;
  label: string;
  count: number;
  percentage: number;
};

export type WorkflowStepDwell = {
  status: string;
  label: string;
  avg_days: number;
  sample_count: number;
};

export type WaitingCustomerRow = {
  shipment_id: string;
  order_number: string | null;
  customer_name: string | null;
  waiting_hours: number;
  last_message_preview: string;
};

export type DocTurnaroundInsight = {
  approval_count: number;
  rejection_count: number;
  rejection_rate_percent: number;
  avg_approval_days: number | null;
};

export type ResponseTimeInsight = {
  median_hours: number | null;
  sample_count: number;
};

export type PerformanceInsights = {
  top_delay_carriers: DelayCarrierInsight[];
  slowest_workflow_step: WorkflowStepDwell | null;
  waiting_customers: WaitingCustomerRow[];
  doc_turnaround: DocTurnaroundInsight;
  response_time: ResponseTimeInsight;
};

export type ShipmentMetricsSummary = {
  message_count: number;
  back_and_forth_count: number;
  median_response_hours: number | null;
  days_in_workflow_status: number | null;
  workflow_status: string | null;
};

export type ShipmentContextSummary = {
  tags: string[];
  risk_level: string | null;
  risk_message: string | null;
  triage_bucket_key: TriageBucketKey | null;
  metrics: ShipmentMetricsSummary;
};

export const SHIPMENT_ROOT_CAUSES = [
  "docs_late",
  "port_congestion",
  "miscommunication",
  "internal_delay",
] as const;

export type ShipmentRootCause = (typeof SHIPMENT_ROOT_CAUSES)[number];

export const SHIPMENT_ROOT_CAUSE_LABELS: Record<ShipmentRootCause, string> = {
  docs_late: "Docs late",
  port_congestion: "Port congestion",
  miscommunication: "Miscommunication",
  internal_delay: "Internal delay",
};

export type ShipmentInsightCard = {
  id: string;
  tone: "info" | "warning" | "critical";
  headline: string;
  detail: string | null;
};

export type SuggestedShipmentAction = {
  id: string;
  label: string;
  description: string | null;
  handler_key: string;
  priority: number;
};

export type OrgPerformanceSettings = {
  sla_response_hours: number;
  stale_update_reminder_hours: number;
  required_document_types: string[];
};

export const DEFAULT_ORG_PERFORMANCE_SETTINGS: OrgPerformanceSettings = {
  sla_response_hours: 24,
  stale_update_reminder_hours: 48,
  required_document_types: [],
};
