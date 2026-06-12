import type { Alert, ReportMessage } from "@shared/dashboard-metrics.ts";
import { buildDaySeries } from "@shared/dashboard-metrics.ts";
import { isInAppNotification, isOperationalAlert } from "@shared/in-app-event-taxonomy.ts";
import { normalizeShipmentWorkflowStatus, shipmentWorkflowDisplayLabel } from "@shared/shipment-workflow-status.ts";
import { SHIPMENT_WORKFLOW_STATUSES } from "@shared/dto/logistics.dto.ts";
import {
  SHIPMENT_ROOT_CAUSE_LABELS,
  SHIPMENT_ROOT_CAUSES,
  type ShipmentRootCause,
} from "@shared/dto/performance.dto.ts";

export interface DashboardBreakdownRow {
  key: string;
  label: string;
  count: number;
  barClass: string;
}

export interface DashboardInsightsMetrics {
  riskCounts: Record<string, number>;
  workflowCounts: Record<string, number>;
  assignmentCounts: { assigned: number; unassigned: number; ownedUnassigned: number };
  alertSummary: {
    open: number;
    acknowledged: number;
    bySeverity: Record<"critical" | "warning" | "info", number>;
    topTypes: { alert_type: string; label: string; count: number }[];
  };
  notificationSummary: {
    open: number;
    acknowledged: number;
    bySeverity: Record<"critical" | "warning" | "info", number>;
    topTypes: { alert_type: string; label: string; count: number }[];
  };
  rootCauseCounts: Record<string, number>;
  timeToResolveSeries: {
    label: string;
    alertAckMedianHours: number | null;
    replyMedianHours: number | null;
    alertSampleCount: number;
    replySampleCount: number;
  }[];
}

export type DashboardInsightsShipmentRow = {
  risk_level: string | null;
  workflow_status: string | null;
  root_cause: string | null;
  assignee_user_id: string | null;
  created_by: string | null;
};

type AlertRow = Pick<
  Alert,
  "alert_type" | "severity" | "acknowledged_at" | "created_at" | "inbox_kind"
>;
type MessageRow = Pick<ReportMessage, "author_kind" | "created_at" | "is_internal">;

const RISK_KEYS = ["low", "medium", "high", "unset"] as const;

const RISK_LABELS: Record<(typeof RISK_KEYS)[number], string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  unset: "Not Set",
};

const RISK_BAR_CLASS: Record<(typeof RISK_KEYS)[number], string> = {
  low: "bg-emerald-500/90 dark:bg-emerald-500",
  medium: "bg-amber-500/90 dark:bg-amber-500",
  high: "bg-red-500/90 dark:bg-red-500",
  unset: "bg-zinc-300 dark:bg-zinc-600",
};

const WORKFLOW_BAR_CLASSES = [
  "bg-primary-orange/90",
  "bg-amber-500/90",
  "bg-emerald-500/90 dark:bg-emerald-500",
  "bg-red-500/90 dark:bg-red-500",
  "bg-violet-500/80 dark:bg-violet-500",
  "bg-zinc-300 dark:bg-zinc-600",
] as const;

const ASSIGNMENT_KEYS = ["assigned", "unassigned", "ownedUnassigned"] as const;

const ASSIGNMENT_LABELS: Record<(typeof ASSIGNMENT_KEYS)[number], string> = {
  assigned: "Assigned",
  unassigned: "Unassigned",
  ownedUnassigned: "Owned, No Assignee",
};

const ASSIGNMENT_BAR_CLASS: Record<(typeof ASSIGNMENT_KEYS)[number], string> = {
  assigned: "bg-emerald-500/90 dark:bg-emerald-500",
  unassigned: "bg-zinc-300 dark:bg-zinc-600",
  ownedUnassigned: "bg-amber-500/90 dark:bg-amber-500",
};

const SEVERITY_KEYS = ["critical", "warning", "info"] as const;

const SEVERITY_LABELS: Record<(typeof SEVERITY_KEYS)[number], string> = {
  critical: "Critical",
  warning: "Warning",
  info: "Info",
};

const SEVERITY_BAR_CLASS: Record<(typeof SEVERITY_KEYS)[number], string> = {
  critical: "bg-red-500/90 dark:bg-red-500",
  warning: "bg-amber-500/90 dark:bg-amber-500",
  info: "bg-sky-500/80 dark:bg-sky-500",
};

const ROOT_CAUSE_BAR_CLASSES = [
  "bg-primary-orange/90",
  "bg-amber-500/90",
  "bg-violet-500/80 dark:bg-violet-500",
  "bg-sky-500/80 dark:bg-sky-500",
  "bg-zinc-300 dark:bg-zinc-600",
] as const;

const ALERT_TYPE_LABELS: Record<string, string> = {
  SHIPMENT_DELAYED: "Shipment Delayed",
  STATUS_EXCEPTION: "Status Exception",
  SLA_RESPONSE_DUE: "SLA Response Due",
  TRACKING_SYNC_FAILED: "Tracking Sync Failed",
  TRACKING_SYNC_OK: "Tracking Sync OK",
  DOCUMENT_REJECTED: "Document Rejected",
  DOCUMENTS_APPROVED: "Documents Approved",
  DOCUMENT_UPLOADED: "Document Uploaded",
  MESSAGE_NEW: "New Message",
  MESSAGE_REPLY: "Message Reply",
  ASSIGNMENT_ASSIGNEE: "Assignment",
  ASSIGNMENT_PARTICIPANT: "Participant Added",
  INFO: "Info",
};

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const raw = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  return Math.round(raw * 10) / 10;
}

function hoursBetween(startIso: string, endIso: string): number {
  const start = Date.parse(startIso);
  const end = Date.parse(endIso);
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0;
  return (end - start) / 3_600_000;
}

function startOfUtcDayFromMs(ms: number): number {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function dayLabel(startMs: number): string {
  return new Date(startMs).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function alertTypeDisplayLabel(alertType: string): string {
  return ALERT_TYPE_LABELS[alertType] ?? alertType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizeSeverity(severity: string): (typeof SEVERITY_KEYS)[number] {
  if (severity === "critical" || severity === "warning") return severity;
  return "info";
}

export function countShipmentRiskLevels(
  shipments: readonly DashboardInsightsShipmentRow[],
): Record<string, number> {
  const counts: Record<string, number> = { low: 0, medium: 0, high: 0, unset: 0 };
  for (const row of shipments) {
    const key = row.risk_level?.trim().toLowerCase();
    if (key === "low" || key === "medium" || key === "high") {
      counts[key] += 1;
    } else {
      counts.unset += 1;
    }
  }
  return counts;
}

export function countShipmentWorkflowStatuses(
  shipments: readonly DashboardInsightsShipmentRow[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const status of SHIPMENT_WORKFLOW_STATUSES) {
    counts[status] = 0;
  }
  counts.unknown = 0;

  for (const row of shipments) {
    const normalized = normalizeShipmentWorkflowStatus(row.workflow_status);
    const key = normalized ?? "unknown";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export function countShipmentAssignments(
  shipments: readonly DashboardInsightsShipmentRow[],
): DashboardInsightsMetrics["assignmentCounts"] {
  let assigned = 0;
  let unassigned = 0;
  let ownedUnassigned = 0;

  for (const row of shipments) {
    if (row.assignee_user_id) {
      assigned += 1;
      continue;
    }
    unassigned += 1;
    if (row.created_by) {
      ownedUnassigned += 1;
    }
  }

  return { assigned, unassigned, ownedUnassigned };
}

export function buildAlertSummary(alerts: readonly AlertRow[]): DashboardInsightsMetrics["alertSummary"] {
  return buildInboxEventSummary(alerts.filter((alert) => isOperationalAlert(alert)));
}

export function buildNotificationSummary(
  alerts: readonly AlertRow[],
): DashboardInsightsMetrics["notificationSummary"] {
  return buildInboxEventSummary(alerts.filter((alert) => isInAppNotification(alert)));
}

function buildInboxEventSummary(
  alerts: readonly AlertRow[],
): DashboardInsightsMetrics["alertSummary"] {
  let open = 0;
  let acknowledged = 0;
  const bySeverity: Record<(typeof SEVERITY_KEYS)[number], number> = {
    critical: 0,
    warning: 0,
    info: 0,
  };
  const typeCounts = new Map<string, number>();

  for (const alert of alerts) {
    if (alert.acknowledged_at) {
      acknowledged += 1;
    } else {
      open += 1;
      const severity = normalizeSeverity(alert.severity);
      bySeverity[severity] += 1;
    }
    typeCounts.set(alert.alert_type, (typeCounts.get(alert.alert_type) ?? 0) + 1);
  }

  const topTypes = [...typeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([alert_type, count]) => ({
      alert_type,
      label: alertTypeDisplayLabel(alert_type),
      count,
    }));

  return { open, acknowledged, bySeverity, topTypes };
}

export function countShipmentRootCauses(
  shipments: readonly DashboardInsightsShipmentRow[],
): Record<string, number> {
  const counts: Record<string, number> = { unset: 0 };
  for (const cause of SHIPMENT_ROOT_CAUSES) {
    counts[cause] = 0;
  }

  for (const row of shipments) {
    const key = row.root_cause?.trim();
    if (key && SHIPMENT_ROOT_CAUSES.includes(key as ShipmentRootCause)) {
      counts[key as ShipmentRootCause] += 1;
    } else {
      counts.unset += 1;
    }
  }

  return counts;
}

export function buildTimeToResolveSeries(
  alerts: readonly AlertRow[],
  messages: readonly MessageRow[],
  dayStarts: readonly number[],
): DashboardInsightsMetrics["timeToResolveSeries"] {
  const daySet = new Set(dayStarts);
  const alertBuckets = new Map<number, number[]>();
  const replyBuckets = new Map<number, number[]>();
  for (const start of dayStarts) {
    alertBuckets.set(start, []);
    replyBuckets.set(start, []);
  }

  for (const alert of alerts) {
    if (!isOperationalAlert(alert)) continue;
    if (!alert.acknowledged_at) continue;
    const ackMs = Date.parse(alert.acknowledged_at);
    if (Number.isNaN(ackMs)) continue;
    const dayStart = startOfUtcDayFromMs(ackMs);
    if (!daySet.has(dayStart)) continue;
    const hours = hoursBetween(alert.created_at, alert.acknowledged_at);
    if (hours <= 0) continue;
    alertBuckets.get(dayStart)!.push(hours);
  }

  const sortedMessages = [...messages]
    .filter((m) => !m.is_internal)
    .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));

  let pendingCustomerAt: string | null = null;
  for (const msg of sortedMessages) {
    const kind = msg.author_kind;
    if (kind === "customer") {
      if (!pendingCustomerAt) pendingCustomerAt = msg.created_at;
      continue;
    }
    if ((kind === "operator" || kind === "team") && pendingCustomerAt) {
      const replyMs = Date.parse(msg.created_at);
      if (Number.isNaN(replyMs)) {
        pendingCustomerAt = null;
        continue;
      }
      const dayStart = startOfUtcDayFromMs(replyMs);
      if (daySet.has(dayStart)) {
        const hours = hoursBetween(pendingCustomerAt, msg.created_at);
        if (hours > 0) {
          replyBuckets.get(dayStart)!.push(hours);
        }
      }
      pendingCustomerAt = null;
    }
  }

  return dayStarts.map((start) => {
    const alertSamples = alertBuckets.get(start) ?? [];
    const replySamples = replyBuckets.get(start) ?? [];
    return {
      label: dayLabel(start),
      alertAckMedianHours: median(alertSamples),
      replyMedianHours: median(replySamples),
      alertSampleCount: alertSamples.length,
      replySampleCount: replySamples.length,
    };
  });
}

export function buildDashboardInsightsMetrics(input: {
  shipments: readonly DashboardInsightsShipmentRow[];
  alerts: readonly AlertRow[];
  messages: readonly MessageRow[];
  now?: number;
}): DashboardInsightsMetrics {
  const now = input.now ?? Date.now();
  const dayStarts = buildDaySeries(now, 14);

  return {
    riskCounts: countShipmentRiskLevels(input.shipments),
    workflowCounts: countShipmentWorkflowStatuses(input.shipments),
    assignmentCounts: countShipmentAssignments(input.shipments),
    alertSummary: buildAlertSummary(input.alerts),
    notificationSummary: buildNotificationSummary(input.alerts),
    rootCauseCounts: countShipmentRootCauses(input.shipments),
    timeToResolveSeries: buildTimeToResolveSeries(input.alerts, input.messages, dayStarts),
  };
}

function breakdownTotal(rows: DashboardBreakdownRow[]): number {
  return rows.reduce((sum, row) => sum + row.count, 0);
}

export function buildRiskBreakdownRows(counts: Record<string, number>): DashboardBreakdownRow[] {
  return RISK_KEYS.map((key) => ({
    key,
    label: RISK_LABELS[key],
    count: counts[key] ?? 0,
    barClass: RISK_BAR_CLASS[key],
  }));
}

export function buildWorkflowBreakdownRows(counts: Record<string, number>): DashboardBreakdownRow[] {
  const orderedKeys = [...SHIPMENT_WORKFLOW_STATUSES, "unknown"] as const;
  return orderedKeys.map((key, index) => ({
    key,
    label: key === "unknown" ? "Unknown" : shipmentWorkflowDisplayLabel(key),
    count: counts[key] ?? 0,
    barClass: WORKFLOW_BAR_CLASSES[index % WORKFLOW_BAR_CLASSES.length],
  }));
}

export function buildAssignmentBreakdownRows(
  counts: DashboardInsightsMetrics["assignmentCounts"],
): DashboardBreakdownRow[] {
  return ASSIGNMENT_KEYS.map((key) => ({
    key,
    label: ASSIGNMENT_LABELS[key],
    count: counts[key],
    barClass: ASSIGNMENT_BAR_CLASS[key],
  }));
}

export function buildAlertSeverityRows(
  summary: DashboardInsightsMetrics["alertSummary"],
): DashboardBreakdownRow[] {
  const statusRows: DashboardBreakdownRow[] = [
    {
      key: "open",
      label: "Open",
      count: summary.open,
      barClass: "bg-primary-orange/90",
    },
    {
      key: "acknowledged",
      label: "Acknowledged",
      count: summary.acknowledged,
      barClass: "bg-zinc-300 dark:bg-zinc-600",
    },
  ];

  const severityRows = SEVERITY_KEYS.map((key) => ({
    key: `severity-${key}`,
    label: SEVERITY_LABELS[key],
    count: summary.bySeverity[key],
    barClass: SEVERITY_BAR_CLASS[key],
  }));

  return [...statusRows, ...severityRows];
}

export function buildAlertTypeRows(
  summary: DashboardInsightsMetrics["alertSummary"],
): DashboardBreakdownRow[] {
  return summary.topTypes.map((row, index) => ({
    key: row.alert_type,
    label: row.label,
    count: row.count,
    barClass: WORKFLOW_BAR_CLASSES[index % WORKFLOW_BAR_CLASSES.length],
  }));
}

export function buildAlertBreakdownRows(
  summary: DashboardInsightsMetrics["alertSummary"],
): DashboardBreakdownRow[] {
  const statusAndSeverity = buildAlertSeverityRows(summary);
  const typeRows = buildAlertTypeRows(summary);
  return [...statusAndSeverity, ...typeRows];
}

export function buildRootCauseBreakdownRows(counts: Record<string, number>): DashboardBreakdownRow[] {
  const orderedKeys = [...SHIPMENT_ROOT_CAUSES, "unset"] as const;
  return orderedKeys.map((key, index) => ({
    key,
    label: key === "unset" ? "Not Tagged" : SHIPMENT_ROOT_CAUSE_LABELS[key],
    count: counts[key] ?? 0,
    barClass: ROOT_CAUSE_BAR_CLASSES[index % ROOT_CAUSE_BAR_CLASSES.length],
  }));
}

export function breakdownRowsHaveData(rows: DashboardBreakdownRow[]): boolean {
  return breakdownTotal(rows) > 0;
}
