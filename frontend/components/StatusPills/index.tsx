import { pillBase, pillCompactBase } from "./constants";
import {
  shipmentWorkflowDisplayLabel,
  shipmentWorkflowPillClass,
  trackingWorkflowPillClass,
  workflowLabel,
} from "./utils";

export { shipmentWorkflowPillClass, trackingWorkflowPillClass } from "./utils";

export function TrackingWorkflowStatusPill({ status }: { status: string }) {
  return (
    <span className={`${pillBase} ${trackingWorkflowPillClass(status)}`} title={status}>
      {workflowLabel(status)}
    </span>
  );
}

export function ShipmentWorkflowStatusPill({
  status,
  compact = false,
}: {
  status: string;
  compact?: boolean;
}) {
  const label = shipmentWorkflowDisplayLabel(status);
  const base = compact ? pillCompactBase : pillBase;
  return (
    <span className={`${base} ${shipmentWorkflowPillClass(status)}`} title={label}>
      {label}
    </span>
  );
}

/** Carrier / API-reported status: neutral pill, title case (arbitrary phrases). */
export function CarrierReportedStatusPill({ status }: { status: string | null }) {
  if (status == null || !String(status).trim()) {
    return <span className="text-sm text-zinc-500">—</span>;
  }
  const t = String(status).trim();
  return (
    <span
      className={`${pillBase} bg-zinc-100 text-zinc-800 ring-zinc-300/80 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-600/50`}
      title={t}
    >
      {workflowLabel(t)}
    </span>
  );
}

/** Share link row: active vs revoked */
export function ShareLinkStatePill({ active }: { active: boolean }) {
  return (
    <span
      className={
        active
          ? `${pillBase} bg-emerald-50 text-emerald-950 ring-emerald-200/90 dark:bg-emerald-950/50 dark:text-emerald-100 dark:ring-emerald-800/45`
          : `${pillBase} bg-zinc-200/80 text-zinc-800 ring-zinc-400/50 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-600/50`
      }
    >
      {active ? "Active" : "Revoked"}
    </span>
  );
}
