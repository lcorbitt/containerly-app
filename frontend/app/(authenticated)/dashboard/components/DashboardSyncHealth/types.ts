import type { PersonalMetrics } from "@/utils/dashboard-metrics";

export interface DashboardSyncHealthProps {
  metrics: PersonalMetrics | null;
  loading?: boolean;
}

export interface SyncHealthRow {
  key: string;
  label: string;
  count: number;
  barClass: string;
}
