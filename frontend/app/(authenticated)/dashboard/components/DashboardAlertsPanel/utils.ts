import {
  TRIAGE_BUCKET_LABELS,
  flattenTriageRows,
  type TriageBucket,
  type TriageBucketKey,
} from "@/utils/dashboard-metrics";
import type { AlertListItem } from "./types";

function severityForBucket(key: TriageBucketKey): AlertListItem["severity"] {
  if (key === "exceptions") return "critical";
  if (key === "eta") return "warning";
  return "info";
}

function tagLabelForBucket(key: TriageBucketKey): string {
  switch (key) {
    case "exceptions":
      return "Exception";
    case "eta":
      return "Delay";
    case "docs":
      return "Docs";
    case "customer":
      return "Reply";
    default:
      return TRIAGE_BUCKET_LABELS[key];
  }
}

export function buildAlertListItems(buckets: TriageBucket[]): AlertListItem[] {
  return flattenTriageRows(buckets).map((row) => ({
    containerId: row.containerId,
    containerNumber: row.containerNumber,
    detail: row.detail,
    bucketKey: row.bucketKey,
    bucketLabel: TRIAGE_BUCKET_LABELS[row.bucketKey],
    severity: severityForBucket(row.bucketKey),
    tagLabel: tagLabelForBucket(row.bucketKey),
  }));
}
