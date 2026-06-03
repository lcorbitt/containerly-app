import {
  TRIAGE_BUCKET_LABELS,
  flattenTriageRows,
  formatTriageRouteLine,
  type TriageActionContext,
  type TriageBucket,
  type TriageBucketKey,
} from "@/utils/dashboard-metrics";
import { shipmentWorkflowDisplayLabel } from "@/utils/shipment-workflow-status";
import type { AlertListItem } from "./types";

const TRACKING_STATUS_LABELS: Record<string, string> = {
  pending: "Sync pending",
  syncing: "Syncing",
  active: "Carrier active",
  completed: "Sync complete",
  failed: "Sync failed",
};

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

function trackingStatusLabel(status: string | null): string | null {
  if (!status?.trim()) return null;
  const key = status.toLowerCase().trim();
  return TRACKING_STATUS_LABELS[key] ?? status.replace(/_/g, " ");
}

export function primaryActionItemTitle(item: AlertListItem): string {
  const order = item.orderNumber?.trim();
  if (order) return order;
  return item.containerNumber;
}

export function formatActionItemMetaLine(item: AlertListItem): string | null {
  const parts: string[] = [];

  const customer = item.customerName?.trim();
  if (customer) parts.push(customer);

  parts.push(item.bucketLabel);

  const syncLabel = trackingStatusLabel(item.trackingStatus);
  if (syncLabel) parts.push(syncLabel);

  const carrier = item.carrierStatus?.trim();
  if (carrier) parts.push(carrier);

  if (item.bucketKey === "docs" && item.workflowStatus) {
    parts.push(shipmentWorkflowDisplayLabel(item.workflowStatus));
  }

  if (item.bucketKey === "eta") {
    const location = item.containerLocation?.trim();
    if (location) parts.push(location);
  }

  return parts.length > 0 ? parts.join(" · ") : null;
}

export function buildAlertListItems(
  buckets: TriageBucket[],
  actionContextByContainerId: Record<string, TriageActionContext> = {},
): AlertListItem[] {
  return flattenTriageRows(buckets).map((row) => {
    const context = actionContextByContainerId[row.containerId];

    return {
      containerId: row.containerId,
      containerNumber: row.containerNumber,
      detail: row.detail,
      bucketKey: row.bucketKey,
      bucketLabel: TRIAGE_BUCKET_LABELS[row.bucketKey],
      severity: severityForBucket(row.bucketKey),
      tagLabel: tagLabelForBucket(row.bucketKey),
      shipmentId: context?.shipmentId ?? null,
      orderNumber: context?.orderNumber ?? null,
      customerName: context?.customerName ?? null,
      routeLine: context
        ? formatTriageRouteLine(context.portOfLoading, context.portOfDestination)
        : null,
      carrierStatus: context?.carrierStatus ?? null,
      containerLocation: context?.containerLocation ?? null,
      trackingStatus: context?.trackingStatus ?? null,
      workflowStatus: context?.workflowStatus ?? null,
    };
  });
}
