import { describe, expect, it } from "vitest";
import {
  buildAlertSummary,
  buildDashboardInsightsMetrics,
  buildTimeToResolveSeries,
  countShipmentAssignments,
  countShipmentRiskLevels,
  countShipmentRootCauses,
  countShipmentWorkflowStatuses,
} from "./dashboard-insights";
import { buildDaySeries } from "./dashboard-metrics";

describe("countShipmentRiskLevels", () => {
  it("counts risk levels and unset shipments", () => {
    const counts = countShipmentRiskLevels([
      { risk_level: "low", workflow_status: null, root_cause: null, assignee_user_id: null, created_by: "u1" },
      { risk_level: "high", workflow_status: null, root_cause: null, assignee_user_id: null, created_by: "u1" },
      { risk_level: null, workflow_status: null, root_cause: null, assignee_user_id: null, created_by: "u1" },
    ]);
    expect(counts).toEqual({ low: 1, medium: 0, high: 1, unset: 1 });
  });
});

describe("countShipmentWorkflowStatuses", () => {
  it("normalizes workflow statuses into buckets", () => {
    const counts = countShipmentWorkflowStatuses([
      { risk_level: null, workflow_status: "pending_drafts", root_cause: null, assignee_user_id: null, created_by: "u1" },
      { risk_level: null, workflow_status: "draft", root_cause: null, assignee_user_id: null, created_by: "u1" },
      { risk_level: null, workflow_status: null, root_cause: null, assignee_user_id: null, created_by: "u1" },
    ]);
    expect(counts.pending_drafts).toBe(2);
    expect(counts.unknown).toBe(1);
  });
});

describe("countShipmentAssignments", () => {
  it("tracks assigned, unassigned, and owned-without-assignee shipments", () => {
    const counts = countShipmentAssignments([
      { risk_level: null, workflow_status: null, root_cause: null, assignee_user_id: "u2", created_by: "u1" },
      { risk_level: null, workflow_status: null, root_cause: null, assignee_user_id: null, created_by: "u1" },
      { risk_level: null, workflow_status: null, root_cause: null, assignee_user_id: null, created_by: null },
    ]);
    expect(counts).toEqual({ assigned: 1, unassigned: 2, ownedUnassigned: 1 });
  });
});

describe("buildAlertSummary", () => {
  it("summarizes operational alerts only", () => {
    const summary = buildAlertSummary([
      {
        alert_type: "SHIPMENT_DELAYED",
        inbox_kind: "operational_alert",
        severity: "critical",
        acknowledged_at: null,
        created_at: "2026-06-08T10:00:00.000Z",
      },
      {
        alert_type: "SHIPMENT_DELAYED",
        inbox_kind: "operational_alert",
        severity: "warning",
        acknowledged_at: "2026-06-08T12:00:00.000Z",
        created_at: "2026-06-08T09:00:00.000Z",
      },
      {
        alert_type: "DOCUMENT_UPLOADED",
        inbox_kind: "notification",
        severity: "info",
        acknowledged_at: null,
        created_at: "2026-06-08T11:00:00.000Z",
      },
    ]);

    expect(summary.open).toBe(1);
    expect(summary.acknowledged).toBe(1);
    expect(summary.bySeverity).toEqual({ critical: 1, warning: 0, info: 0 });
    expect(summary.topTypes[0]).toMatchObject({ alert_type: "SHIPMENT_DELAYED", count: 2 });
  });
});

describe("countShipmentRootCauses", () => {
  it("counts tagged and untagged root causes", () => {
    const counts = countShipmentRootCauses([
      { risk_level: null, workflow_status: null, root_cause: "docs_late", assignee_user_id: null, created_by: "u1" },
      { risk_level: null, workflow_status: null, root_cause: null, assignee_user_id: null, created_by: "u1" },
    ]);
    expect(counts.docs_late).toBe(1);
    expect(counts.unset).toBe(1);
  });
});

describe("buildTimeToResolveSeries", () => {
  const now = Date.parse("2026-06-09T12:00:00.000Z");
  const dayStarts = buildDaySeries(now, 14);
  const targetDay = dayStarts[dayStarts.length - 1];

  it("buckets alert acknowledge medians by ack day", () => {
    const ackIso = new Date(targetDay + 6 * 3_600_000).toISOString();
    const createdIso = new Date(targetDay + 2 * 3_600_000).toISOString();
    const series = buildTimeToResolveSeries(
      [
        {
          alert_type: "SHIPMENT_DELAYED",
          inbox_kind: "operational_alert",
          severity: "warning",
          created_at: createdIso,
          acknowledged_at: ackIso,
        },
      ],
      [],
      dayStarts,
    );
    const point = series[series.length - 1];
    expect(point.alertAckMedianHours).toBe(4);
    expect(point.alertSampleCount).toBe(1);
  });

  it("buckets customer reply medians by reply day", () => {
    const customerIso = new Date(targetDay + 1 * 3_600_000).toISOString();
    const replyIso = new Date(targetDay + 5 * 3_600_000).toISOString();
    const messages = [
      { author_kind: "customer", created_at: customerIso, is_internal: false },
      { author_kind: "operator", created_at: replyIso, is_internal: false },
    ];
    const series = buildTimeToResolveSeries([], messages, dayStarts);
    const point = series[series.length - 1];
    expect(point.replyMedianHours).toBe(4);
    expect(point.replySampleCount).toBe(1);
  });

  it("returns null medians for days without samples", () => {
    const series = buildTimeToResolveSeries([], [], dayStarts);
    expect(series.every((point) => point.alertAckMedianHours == null)).toBe(true);
    expect(series.every((point) => point.replyMedianHours == null)).toBe(true);
  });
});

describe("buildDashboardInsightsMetrics", () => {
  it("returns empty-friendly metrics for an empty org", () => {
    const metrics = buildDashboardInsightsMetrics({
      shipments: [],
      alerts: [],
      messages: [],
      now: Date.parse("2026-06-09T12:00:00.000Z"),
    });
    expect(metrics.assignmentCounts).toEqual({ assigned: 0, unassigned: 0, ownedUnassigned: 0 });
    expect(metrics.alertSummary.open).toBe(0);
    expect(metrics.notificationSummary.open).toBe(0);
    expect(metrics.timeToResolveSeries).toHaveLength(14);
  });
});
