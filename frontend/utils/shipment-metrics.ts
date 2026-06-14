import type {
  DelayCarrierInsight,
  DocTurnaroundInsight,
  PerformanceInsights,
  ResponseTimeInsight,
  ShipmentContextSummary,
  ShipmentInsightCard,
  ShipmentMetricsSummary,
  WaitingCustomerRow,
  WorkflowStepDwell,
} from "@shared/dto/performance.dto";
import type { ShipmentActivityEvent } from "@shared/dto/shipment.dto";
import type { ShipmentMessage } from "@/types/database";
import {
  type DelayCarrierLineRow,
  type TriageBucketKey,
} from "@/utils/dashboard-metrics";
import { shipmentWorkflowDisplayLabel } from "@/utils/shipment-workflow-status";

type MessageRow = Pick<ShipmentMessage, "shipment_id" | "container_id" | "author_kind" | "created_at" | "is_internal" | "body">;

type WorkflowShipmentRow = {
  id: string;
  workflow_status: string | null;
  created_at: string;
};

type ActivityEventRow = Pick<ShipmentActivityEvent, "event_type" | "occurred_at" | "metadata"> & {
  shipment_id?: string;
};

type ThreadRow = {
  shipment_id: string;
  order_number: string | null;
  customer_name?: string | null;
  last_message_at: string;
  last_message_preview: string;
  last_author_kind: string;
  message_count: number;
};

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function hoursBetween(startIso: string, endIso: string): number {
  const start = Date.parse(startIso);
  const end = Date.parse(endIso);
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0;
  return (end - start) / 3_600_000;
}

function daysBetween(startIso: string, endIso: string): number {
  return hoursBetween(startIso, endIso) / 24;
}

export function computeMedianResponseTimeHours(messages: readonly MessageRow[]): ResponseTimeInsight {
  const sorted = [...messages]
    .filter((m) => !m.is_internal)
    .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));

  const gaps: number[] = [];
  let pendingCustomerAt: string | null = null;

  for (const msg of sorted) {
    const kind = msg.author_kind;
    if (kind === "customer") {
      if (!pendingCustomerAt) pendingCustomerAt = msg.created_at;
      continue;
    }
    if ((kind === "operator" || kind === "team") && pendingCustomerAt) {
      gaps.push(hoursBetween(pendingCustomerAt, msg.created_at));
      pendingCustomerAt = null;
    }
  }

  const medianHours = median(gaps);
  return {
    median_hours: medianHours != null ? Math.round(medianHours * 10) / 10 : null,
    sample_count: gaps.length,
  };
}

export function computeWorkflowDwellByStatus(
  shipments: readonly WorkflowShipmentRow[],
  nowMs: number = Date.now(),
): WorkflowStepDwell[] {
  const buckets = new Map<string, { totalDays: number; count: number }>();

  for (const row of shipments) {
    const status = row.workflow_status?.trim() || "unknown";
    const created = Date.parse(row.created_at);
    if (Number.isNaN(created)) continue;
    const days = (nowMs - created) / 86_400_000;
    const existing = buckets.get(status) ?? { totalDays: 0, count: 0 };
    existing.totalDays += days;
    existing.count += 1;
    buckets.set(status, existing);
  }

  return [...buckets.entries()]
    .map(([status, agg]) => ({
      status,
      label: shipmentWorkflowDisplayLabel(status),
      avg_days: Math.round((agg.totalDays / agg.count) * 10) / 10,
      sample_count: agg.count,
    }))
    .sort((a, b) => b.avg_days - a.avg_days);
}

export function pickSlowestWorkflowStep(dwells: readonly WorkflowStepDwell[]): WorkflowStepDwell | null {
  return dwells[0] ?? null;
}

export function buildTopDelayCarriers(
  lines: readonly DelayCarrierLineRow[],
): DelayCarrierInsight[] {
  const total = lines.length;
  if (total === 0) return [];

  const buckets = new Map<string, { label: string; count: number }>();
  for (const line of lines) {
    const label = line.carrier_label.trim() || "Unknown carrier";
    const key = label.toLowerCase();
    const existing = buckets.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      buckets.set(key, { label, count: 1 });
    }
  }

  return [...buckets.entries()]
    .map(([carrier_key, agg]) => ({
      carrier_key,
      label: agg.label,
      count: agg.count,
      percentage: Math.round((agg.count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

export function buildWaitingCustomers(
  threads: readonly ThreadRow[],
  nowMs: number = Date.now(),
  limit = 5,
): WaitingCustomerRow[] {
  return threads
    .filter((t) => t.last_author_kind === "customer")
    .map((t) => ({
      shipment_id: t.shipment_id,
      order_number: t.order_number,
      customer_name: t.customer_name ?? null,
      waiting_hours: Math.round(hoursBetween(t.last_message_at, new Date(nowMs).toISOString()) * 10) / 10,
      last_message_preview: t.last_message_preview,
    }))
    .sort((a, b) => b.waiting_hours - a.waiting_hours)
    .slice(0, limit);
}

export function computeDocTurnaround(events: readonly ActivityEventRow[]): DocTurnaroundInsight {
  let approvalCount = 0;
  let rejectionCount = 0;
  const approvalDurations: number[] = [];

  const draftTimesByShipment = new Map<string, string>();

  for (const event of events) {
    const shipmentId = event.shipment_id;
    if (event.event_type === "drafts_attached" && shipmentId) {
      draftTimesByShipment.set(shipmentId, event.occurred_at);
    }
    if (event.event_type === "documents_approved") {
      approvalCount += 1;
      if (shipmentId) {
        const draftAt = draftTimesByShipment.get(shipmentId);
        if (draftAt) approvalDurations.push(daysBetween(draftAt, event.occurred_at));
      }
    }
    if (event.event_type === "documents_rejected") {
      rejectionCount += 1;
    }
  }

  const totalReviewed = approvalCount + rejectionCount;
  const avgApproval =
    approvalDurations.length > 0
      ? Math.round((approvalDurations.reduce((a, b) => a + b, 0) / approvalDurations.length) * 10) / 10
      : null;

  return {
    approval_count: approvalCount,
    rejection_count: rejectionCount,
    rejection_rate_percent:
      totalReviewed > 0 ? Math.round((rejectionCount / totalReviewed) * 100) : 0,
    avg_approval_days: avgApproval,
  };
}

export function buildPerformanceInsights(input: {
  delayedCarrierLines: readonly DelayCarrierLineRow[];
  shipments: readonly WorkflowShipmentRow[];
  messages: readonly MessageRow[];
  activityEvents: readonly ActivityEventRow[];
  messageThreads: readonly ThreadRow[];
  nowMs?: number;
}): PerformanceInsights {
  const nowMs = input.nowMs ?? Date.now();
  const dwells = computeWorkflowDwellByStatus(input.shipments, nowMs);

  return {
    top_delay_carriers: buildTopDelayCarriers(input.delayedCarrierLines),
    slowest_workflow_step: pickSlowestWorkflowStep(dwells),
    waiting_customers: buildWaitingCustomers(input.messageThreads, nowMs),
    doc_turnaround: computeDocTurnaround(input.activityEvents),
    response_time: computeMedianResponseTimeHours(input.messages),
  };
}

export function computeShipmentMetrics(input: {
  shipmentId: string;
  workflowStatus: string | null;
  workflowStatusSince?: string | null;
  messages: readonly MessageRow[];
  nowMs?: number;
}): ShipmentMetricsSummary {
  const nowMs = input.nowMs ?? Date.now();
  const scoped = input.messages.filter(
    (m) => m.shipment_id === input.shipmentId && !m.container_id && !m.is_internal,
  );
  const sorted = [...scoped].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
  const response = computeMedianResponseTimeHours(scoped);

  let backAndForth = 0;
  let prevKind: string | null = null;
  for (const msg of sorted) {
    if (msg.author_kind !== prevKind) {
      if (prevKind != null) backAndForth += 1;
      prevKind = msg.author_kind;
    }
  }

  const since = input.workflowStatusSince ?? sorted[0]?.created_at;
  const daysInStatus =
    since && input.workflowStatus
      ? Math.round(daysBetween(since, new Date(nowMs).toISOString()) * 10) / 10
      : null;

  return {
    message_count: scoped.length,
    back_and_forth_count: backAndForth,
    median_response_hours: response.median_hours,
    days_in_workflow_status: daysInStatus,
    workflow_status: input.workflowStatus,
  };
}

export function buildShipmentInsightCards(input: {
  metrics: ShipmentMetricsSummary;
  orgAvgMessages: number;
  orgMedianResponseHours: number | null;
  triageBucketKey: TriageBucketKey | null;
}): ShipmentInsightCard[] {
  const cards: ShipmentInsightCard[] = [];

  if (input.orgAvgMessages > 0 && input.metrics.message_count > input.orgAvgMessages * 2) {
    const ratio = Math.round((input.metrics.message_count / input.orgAvgMessages) * 10) / 10;
    cards.push({
      id: "high_message_volume",
      tone: "warning",
      headline: `${ratio}× more messages than org average`,
      detail: "Extra back-and-forth may signal confusion or missing information.",
    });
  }

  if (
    input.metrics.median_response_hours != null &&
    input.orgMedianResponseHours != null &&
    input.metrics.median_response_hours > input.orgMedianResponseHours * 1.5
  ) {
    cards.push({
      id: "slow_response",
      tone: "warning",
      headline: "Response time above org average",
      detail: `Median reply time on this shipment is ${input.metrics.median_response_hours}h vs org ${input.orgMedianResponseHours}h.`,
    });
  }

  if (input.triageBucketKey === "docs") {
    cards.push({
      id: "missing_docs",
      tone: "critical",
      headline: "Missing documents flagged",
      detail: "Shipments without docs after 24h often see downstream delays.",
    });
  }

  if (input.triageBucketKey === "customer") {
    cards.push({
      id: "customer_waiting",
      tone: "warning",
      headline: "Customer is waiting for a reply",
      detail: "Latest message is from the customer.",
    });
  }

  return cards;
}

export function buildShipmentContextSummary(input: {
  tags: string[];
  risk_level: string | null;
  risk_message: string | null;
  triage_bucket_key: TriageBucketKey | null;
  metrics: ShipmentMetricsSummary;
}): ShipmentContextSummary {
  return {
    tags: input.tags,
    risk_level: input.risk_level,
    risk_message: input.risk_message,
    triage_bucket_key: input.triage_bucket_key,
    metrics: input.metrics,
  };
}
