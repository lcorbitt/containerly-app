import type { DashboardBreakdownRow } from "@/utils/dashboard-insights";

export interface DashboardBreakdownCardProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  rows: DashboardBreakdownRow[];
  loading?: boolean;
  emptyMessage?: string;
  linkHref?: string;
  linkLabel?: string;
  totalOverride?: number;
}
