/** Shared shell: uniform size, weight, and uppercase labels for scanability */
const pillBase =
  "inline-flex max-w-full items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset";

function titleCaseWords(s: string): string {
  return s
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/** Maps `tracking_requests.status` (DB check constraint). */
export function trackingWorkflowPillClass(status: string): string {
  const s = status.toLowerCase().trim();
  switch (s) {
    case "pending":
      return "bg-amber-50 text-amber-950 ring-amber-200/90 dark:bg-amber-950/45 dark:text-amber-100 dark:ring-amber-800/50";
    case "syncing":
      return "bg-sky-50 text-sky-950 ring-sky-200/90 dark:bg-sky-950/50 dark:text-sky-100 dark:ring-sky-800/45";
    case "active":
      return "bg-emerald-50 text-emerald-950 ring-emerald-200/90 dark:bg-emerald-950/50 dark:text-emerald-100 dark:ring-emerald-800/45";
    case "completed":
      return "bg-violet-50 text-violet-950 ring-violet-200/90 dark:bg-violet-950/50 dark:text-violet-100 dark:ring-violet-800/45";
    case "failed":
      return "bg-red-50 text-red-950 ring-red-200/90 dark:bg-red-950/50 dark:text-red-100 dark:ring-red-800/45";
    default:
      return "bg-zinc-100 text-zinc-800 ring-zinc-300/80 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-600/50";
  }
}

function workflowLabel(raw: string): string {
  return titleCaseWords(raw.replace(/_/g, " "));
}

export function TrackingWorkflowStatusPill({ status }: { status: string }) {
  return (
    <span className={`${pillBase} ${trackingWorkflowPillClass(status)}`} title={status}>
      {workflowLabel(status)}
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
      {titleCaseWords(t.replace(/_/g, " "))}
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
