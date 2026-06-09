import type { DashboardBreakdownRow } from "@/utils/dashboard-insights";

export function breakdownCardTotal(rows: DashboardBreakdownRow[], totalOverride?: number): number {
  if (totalOverride != null) return totalOverride;
  return rows.reduce((sum, row) => sum + row.count, 0);
}

export function breakdownBarWidth(count: number, total: number): number {
  if (total === 0 || count === 0) return 0;
  const pct = Math.round((count / total) * 100);
  return Math.max(pct, 4);
}
