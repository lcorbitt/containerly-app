import type { PerformanceInsights } from "@shared/dto/performance.dto";

export function formatHoursLabel(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 48) return `${hours}h`;
  return `${Math.round((hours / 24) * 10) / 10}d`;
}

export function performanceInsightsHasData(insights: PerformanceInsights | null | undefined): boolean {
  if (!insights) return false;
  return (
    insights.top_delay_drivers.length > 0 ||
    insights.slowest_workflow_step != null ||
    insights.waiting_customers.length > 0 ||
    insights.doc_turnaround.approval_count > 0 ||
    insights.response_time.sample_count > 0
  );
}
