import type { DashboardInsightsMetrics } from "@/utils/dashboard-insights";
import type { TimeToResolveChartPoint } from "./types";

export function buildTimeToResolveChartData(
  series: DashboardInsightsMetrics["timeToResolveSeries"] | undefined,
): TimeToResolveChartPoint[] | null {
  if (!series) return null;
  return series.map((point) => ({
    label: point.label,
    alertAckMedianHours: point.alertAckMedianHours,
    replyMedianHours: point.replyMedianHours,
  }));
}

export function timeToResolveChartHasData(series: DashboardInsightsMetrics["timeToResolveSeries"]): boolean {
  return series.some(
    (point) =>
      (point.alertAckMedianHours != null && point.alertAckMedianHours > 0) ||
      (point.replyMedianHours != null && point.replyMedianHours > 0),
  );
}

export function formatResolveHours(value: number | null | undefined): string {
  if (value == null) return "—";
  if (value < 24) return `${value}h`;
  const days = Math.round((value / 24) * 10) / 10;
  return `${days}d`;
}
