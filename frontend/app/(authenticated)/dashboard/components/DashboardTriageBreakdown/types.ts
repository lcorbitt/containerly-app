import type { TriageBucket, TriageBucketKey } from "@/utils/dashboard-metrics";

export interface DashboardTriageBreakdownProps {
  loading?: boolean;
  isAdminView: boolean;
  orgTriageCounts?: Record<TriageBucketKey, number>;
  buckets?: TriageBucket[];
}

export interface TriageBreakdownRow {
  key: TriageBucketKey;
  label: string;
  count: number;
  barClass: string;
}
