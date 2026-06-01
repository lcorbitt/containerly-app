import {
  AlertTriangle,
  CheckCircle2,
  Layers,
  Package,
  Radio,
  UserCheck,
} from "lucide-react";
import type { OrgDashboardMetrics, PersonalMetrics } from "@/utils/dashboard-metrics";
import type { KpiCardItem } from "./types";

export function buildAdminKpiItems(orgMetrics: OrgDashboardMetrics): KpiCardItem[] {
  return [
    {
      icon: <Package className="h-4 w-4" />,
      label: "Shipments",
      value: orgMetrics.shipmentCount,
      sub: "Commercial records in this org",
      tone: "neutral",
    },
    {
      icon: <Layers className="h-4 w-4" />,
      label: "Active lines",
      value: orgMetrics.activeLines,
      sub: "Pending, syncing, or active carrier sync",
      tone: orgMetrics.activeLines > 0 ? "good" : "neutral",
    },
    {
      icon: <AlertTriangle className="h-4 w-4" />,
      label: "Needs attention",
      value: orgMetrics.needsAttention,
      sub: "Org-wide triage items",
      tone: orgMetrics.needsAttention > 0 ? "warn" : "neutral",
    },
    {
      icon: <CheckCircle2 className="h-4 w-4" />,
      label: "Completed sync",
      value: orgMetrics.completedLines,
      sub: "Carrier lines marked completed",
      tone: "neutral",
    },
  ];
}

export function buildPersonalKpiItems(metrics: PersonalMetrics): KpiCardItem[] {
  return [
    {
      icon: <Layers className="h-4 w-4" />,
      label: "Your tracking lines",
      value: metrics.totalMine,
      sub:
        metrics.active > 0
          ? `${metrics.active} active ${metrics.active === 1 ? "line" : "lines"}`
          : "None in progress",
      tone: "neutral",
    },
    {
      icon: <AlertTriangle className="h-4 w-4" />,
      label: "Open alerts",
      value: metrics.unackedAlerts,
      sub: "Unacknowledged on your lines",
      tone: metrics.unackedAlerts > 0 ? "warn" : "neutral",
    },
    {
      icon: <Radio className="h-4 w-4" />,
      label: "Needs attention",
      value: metrics.needsAttention,
      sub: "Items in your triage queue",
      tone: metrics.needsAttention > 0 ? "warn" : "neutral",
    },
    {
      icon: <UserCheck className="h-4 w-4" />,
      label: "Assigned to you",
      value: metrics.assignedToMe,
      sub: `${metrics.staleSync} stale sync ${metrics.staleSync === 1 ? "line" : "lines"} (>48h)`,
      tone: metrics.staleSync > 0 ? "bad" : "neutral",
    },
  ];
}
