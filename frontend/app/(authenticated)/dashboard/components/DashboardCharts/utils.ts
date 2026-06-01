import { shipmentWorkflowDisplayLabel } from "@/utils/shipment-workflow-status";
import { TRIAGE_BUCKET_LABELS, type DayCount, type OrgDashboardMetrics, type PersonalMetrics } from "@/utils/dashboard-metrics";
import type { ChartBarItem, DashboardChartsData, TrendPoint } from "./types";

function formatDayLabel(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function dayCountsToTrendPoints(series: DayCount[]): TrendPoint[] {
  return series.map((d) => ({
    label: formatDayLabel(d.start),
    count: d.count,
  }));
}

function triageCountsToBars(
  triageCounts: Record<string, number>,
): ChartBarItem[] {
  return Object.entries(triageCounts)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({
      key,
      label: TRIAGE_BUCKET_LABELS[key as keyof typeof TRIAGE_BUCKET_LABELS] ?? key,
      value,
    }));
}

function workflowCountsToBars(workflowCounts: Record<string, number>): ChartBarItem[] {
  return Object.entries(workflowCounts)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([key, value]) => ({
      key,
      label: shipmentWorkflowDisplayLabel(key),
      value,
    }));
}

export function buildDashboardChartsData(
  isAdminView: boolean,
  personalMetrics: PersonalMetrics | null,
  orgMetrics: OrgDashboardMetrics | null | undefined,
): DashboardChartsData | null {
  if (isAdminView && orgMetrics) {
    return {
      trendPoints: dayCountsToTrendPoints(orgMetrics.shipmentsCreatedByDay),
      trendTitle: "New shipments (14 days)",
      distributionItems: workflowCountsToBars(orgMetrics.workflowCounts),
      distributionTitle: "Document workflow",
    };
  }

  if (!personalMetrics) return null;

  const triageCounts = {
    exceptions: 0,
    eta: 0,
    docs: 0,
    customer: 0,
  };
  // Personal distribution uses triage from metrics needsAttention broken down via status for bar #2
  // Use sync status breakdown for member bar chart
  const statusItems: ChartBarItem[] = personalMetrics.statusOrder
    .map((key) => ({
      key,
      label: personalMetrics.statusLabels[key],
      value: personalMetrics.statusCounts[key] ?? 0,
    }))
    .filter((item) => item.value > 0);

  return {
    trendPoints: dayCountsToTrendPoints(personalMetrics.createdByDay),
    trendTitle: "New carrier lines (14 days)",
    distributionItems: statusItems.length > 0 ? statusItems : triageCountsToBars(triageCounts),
    distributionTitle: "Carrier sync status",
  };
}
