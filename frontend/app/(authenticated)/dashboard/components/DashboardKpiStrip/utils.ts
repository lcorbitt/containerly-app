import type { OrgDashboardMetrics, PersonalMetrics } from "@/utils/dashboard-metrics";
import type { KpiCardItem } from "./types";

type KpiDataItem = Omit<KpiCardItem, "icon"> & { iconKey: KpiCardItem["iconKey"] };

export function buildAdminKpiItems(orgMetrics: OrgDashboardMetrics): KpiDataItem[] {
  return [
    {
      iconKey: "package",
      label: "Shipments",
      value: orgMetrics.shipmentCount,
      sub: "Commercial records in this org",
      tone: "neutral",
    },
    {
      iconKey: "layers",
      label: "Active lines",
      value: orgMetrics.activeLines,
      sub: "Pending, syncing, or active carrier sync",
      tone: orgMetrics.activeLines > 0 ? "good" : "neutral",
    },
    {
      iconKey: "alert",
      label: "Needs attention",
      value: orgMetrics.needsAttention,
      sub: "Org-wide triage items",
      tone: orgMetrics.needsAttention > 0 ? "warn" : "neutral",
    },
    {
      iconKey: "check",
      label: "Completed sync",
      value: orgMetrics.completedLines,
      sub: "Carrier lines marked completed",
      tone: "neutral",
    },
  ];
}

export function buildPersonalKpiItems(metrics: PersonalMetrics): KpiDataItem[] {
  return [
    {
      iconKey: "layers",
      label: "Your tracking lines",
      value: metrics.totalMine,
      sub:
        metrics.active > 0
          ? `${metrics.active} active ${metrics.active === 1 ? "line" : "lines"}`
          : "None in progress",
      tone: "neutral",
    },
    {
      iconKey: "check",
      label: "Unread notifications",
      value: metrics.unreadNotifications,
      sub: "In-app bell items on your shipments",
      tone: metrics.unreadNotifications > 0 ? "warn" : "neutral",
    },
    {
      iconKey: "radio",
      label: "Needs attention",
      value: metrics.needsAttention,
      sub: "Items in your triage queue",
      tone: metrics.needsAttention > 0 ? "warn" : "neutral",
    },
    {
      iconKey: "user",
      label: "Assigned to you",
      value: metrics.assignedToMe,
      sub: `${metrics.staleSync} stale sync ${metrics.staleSync === 1 ? "line" : "lines"} (>48h)`,
      tone: metrics.staleSync > 0 ? "bad" : "neutral",
    },
  ];
}
