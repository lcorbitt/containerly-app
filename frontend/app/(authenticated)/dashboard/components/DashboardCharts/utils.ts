import { shipmentWorkflowDisplayLabel } from "@/utils/shipment-workflow-status";
import type { DayCount, OrgDashboardMetrics, PersonalMetrics } from "@/utils/dashboard-metrics";
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
    distributionItems: statusItems,
    distributionTitle: "Carrier sync status",
  };
}
