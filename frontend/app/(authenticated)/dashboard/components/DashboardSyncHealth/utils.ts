import type { PersonalMetrics } from "@/utils/dashboard-metrics";
import { SYNC_STATUS_BAR_CLASS } from "./constants";
import type { SyncHealthRow } from "./types";

export function buildSyncHealthRows(metrics: PersonalMetrics): SyncHealthRow[] {
  return metrics.statusOrder.map((key) => ({
    key,
    label: metrics.statusLabels[key],
    count: metrics.statusCounts[key] ?? 0,
    barClass: SYNC_STATUS_BAR_CLASS[key] ?? "bg-zinc-300 dark:bg-zinc-600",
  }));
}

export function syncHealthCallout(metrics: PersonalMetrics): string | null {
  if (metrics.failed > 0) {
    return `${metrics.failed} failed ${metrics.failed === 1 ? "line" : "lines"} need attention`;
  }
  if (metrics.staleSync > 0) {
    return `${metrics.staleSync} active ${metrics.staleSync === 1 ? "line" : "lines"} with no sync in 48h`;
  }
  if (metrics.active === 0 && metrics.totalMine === 0) {
    return "No carrier lines in your scope yet";
  }
  return null;
}
