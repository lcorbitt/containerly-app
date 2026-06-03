import {
  TRIAGE_BUCKET_KEYS,
  TRIAGE_BUCKET_LABELS,
  triageCountsFromBuckets,
  type TriageBucket,
  type TriageBucketKey,
} from "@/utils/dashboard-metrics";
import type { TriageBreakdownRow } from "./types";
import {
  DASHBOARD_TRIAGE_BREAKDOWN_BAR_CRITICAL_CLASS,
  DASHBOARD_TRIAGE_BREAKDOWN_BAR_INFO_CLASS,
  DASHBOARD_TRIAGE_BREAKDOWN_BAR_WARNING_CLASS,
} from "./constants";

function barClassForBucket(key: TriageBucketKey): string {
  if (key === "exceptions") return DASHBOARD_TRIAGE_BREAKDOWN_BAR_CRITICAL_CLASS;
  if (key === "eta") return DASHBOARD_TRIAGE_BREAKDOWN_BAR_WARNING_CLASS;
  return DASHBOARD_TRIAGE_BREAKDOWN_BAR_INFO_CLASS;
}

export function buildTriageBreakdownRows(
  counts: Record<TriageBucketKey, number>,
): TriageBreakdownRow[] {
  return TRIAGE_BUCKET_KEYS.map((key) => ({
    key,
    label: TRIAGE_BUCKET_LABELS[key],
    count: counts[key] ?? 0,
    barClass: barClassForBucket(key),
  }));
}

export function resolveTriageBreakdownCounts(input: {
  isAdminView: boolean;
  orgTriageCounts?: Record<TriageBucketKey, number>;
  buckets?: TriageBucket[];
}): Record<TriageBucketKey, number> {
  if (input.isAdminView && input.orgTriageCounts) {
    return input.orgTriageCounts;
  }
  return triageCountsFromBuckets(input.buckets ?? []);
}

export function triageBreakdownTotal(counts: Record<TriageBucketKey, number>): number {
  return Object.values(counts).reduce((sum, count) => sum + count, 0);
}
