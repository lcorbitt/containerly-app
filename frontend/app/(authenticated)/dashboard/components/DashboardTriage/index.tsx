"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import type { Alert, Container, ReportMessage, TrackingRequest } from "@/types/database";
import { isRequestInMyScope } from "@/utils/dashboard-scope";

export type DashboardTriageProps = {
  userId: string | null;
  /** While triage data is being fetched (tracking requests, scope, attachments, messages). */
  loading?: boolean;
  requests: TrackingRequest[];
  alerts: Alert[];
  containersById: Record<string, Pick<Container, "id" | "status" | "location" | "shipment_id">>;
  /** `shipments.created_by` keyed by shipment id (from `containers.shipment_id`). */
  shipmentOwnerByShipmentId: Record<string, string | null>;
  /** `shipments.assignee_user_id` keyed by shipment id. */
  shipmentAssigneeByShipmentId: Record<string, string | null>;
  attachmentCountByRequestId: Record<string, number>;
  messages: ReportMessage[];
  /** Shipment IDs where the current user is a `shipment_participants` row. */
  participatingShipmentIds: ReadonlySet<string>;
};

const ANGRY_HINTS =
  /\b(urgent|asap|immediately|unacceptable|frustrated|angry|complaint|refund|legal|lawsuit|terrible|worst|where\s+is|still\s+waiting|no\s+one\s+respond|unprofessional)\b|[!?]{2,}/i;

function locationEtaSlipped(location: Record<string, unknown> | null | undefined): boolean {
  if (!location || typeof location !== "object") return false;
  const now = Date.now();
  for (const key of ["eta_final_destination", "eta_next_destination"] as const) {
    const v = location[key];
    if (typeof v !== "string") continue;
    const t = Date.parse(v.trim());
    if (!Number.isNaN(t) && t < now) return true;
  }
  return false;
}

function isWorkflowActive(r: TrackingRequest): boolean {
  return r.status === "pending" || r.status === "syncing" || r.status === "active";
}

type TriageRow = {
  containerId: string;
  containerNumber: string;
  detail: string;
};

export type TriageBucket = {
  key: string;
  label: string;
  hint: string;
  rows: TriageRow[];
};

/** Shared with dashboard overview so triage counts stay consistent. */
export function buildTriageBuckets(props: DashboardTriageProps): TriageBucket[] {
  const {
    userId,
    requests,
    alerts,
    containersById,
    shipmentOwnerByShipmentId,
    shipmentAssigneeByShipmentId,
    attachmentCountByRequestId,
    messages,
    participatingShipmentIds,
  } = props;

  const participating = participatingShipmentIds;
  const mine = requests.filter((r) =>
    isRequestInMyScope(
      r,
      userId,
      participating,
      containersById,
      shipmentOwnerByShipmentId,
      shipmentAssigneeByShipmentId,
    ),
  );
  const mineIds = new Set(mine.map((r) => r.id));
  const byId = new Map(mine.map((r) => [r.id, r] as const));

  const exceptions: TriageRow[] = [];
  const etas: TriageRow[] = [];
  const docs: TriageRow[] = [];
  const customer: TriageRow[] = [];

  const pushUnique = (list: TriageRow[], row: TriageRow) => {
    if (list.some((x) => x.containerId === row.containerId && x.detail === row.detail)) return;
    list.push(row);
  };

  const requestForContainer = (containerId: string | null | undefined) =>
    containerId ? mine.find((r) => r.container_id === containerId) : undefined;

  const firstRequestForShipment = (shipmentId: string | null | undefined) =>
    shipmentId
      ? mine.find(
          (r) => r.container_id && containersById[r.container_id]?.shipment_id === shipmentId,
        )
      : undefined;

  for (const r of mine) {
    const c = r.container_id ? containersById[r.container_id] : undefined;
    const st = (c?.status ?? "").toUpperCase();

    if (!r.container_id) continue;

    if (r.status === "failed" || r.error_message) {
      pushUnique(exceptions, {
        containerId: r.container_id,
        containerNumber: r.container_number,
        detail: r.error_message ? `Sync issue: ${r.error_message.slice(0, 80)}` : "Tracking sync failed",
      });
    }

    if (st.includes("EXCEPTION")) {
      pushUnique(exceptions, {
        containerId: r.container_id,
        containerNumber: r.container_number,
        detail: c?.status ? `Carrier status: ${c.status}` : "Exception reported on container",
      });
    }
  }

  for (const a of alerts) {
    if (!a.container_id) continue;
    const r = requestForContainer(a.container_id);
    if (!r || !mineIds.has(r.id)) continue;
    if (a.alert_type === "STATUS_EXCEPTION" || a.severity === "critical") {
      pushUnique(exceptions, {
        containerId: a.container_id!,
        containerNumber: r.container_number,
        detail: a.message,
      });
    }
    if (a.alert_type === "SHIPMENT_DELAYED") {
      pushUnique(etas, {
        containerId: a.container_id!,
        containerNumber: r.container_number,
        detail: a.message,
      });
    }
  }

  for (const r of mine) {
    if (!isWorkflowActive(r) || !r.container_id) continue;
    const c = containersById[r.container_id];
    const st = (c?.status ?? "").toUpperCase();
    if (st.includes("DELAY")) {
      pushUnique(etas, {
        containerId: r.container_id,
        containerNumber: r.container_number,
        detail: "Carrier marked shipment as delayed",
      });
    }
    const loc = c?.location as Record<string, unknown> | null | undefined;
    if (locationEtaSlipped(loc)) {
      pushUnique(etas, {
        containerId: r.container_id,
        containerNumber: r.container_number,
        detail: "Carrier ETA is in the past — confirm latest milestone",
      });
    }
  }

  const dayMs = 86_400_000;
  const now = Date.now();
  for (const r of mine) {
    if (!isWorkflowActive(r)) continue;
    const created = Date.parse(r.created_at);
    if (Number.isNaN(created) || now - created < dayMs) continue;
    if (!r.container_id) continue;
    const n = attachmentCountByRequestId[r.id] ?? 0;
    if (n === 0) {
      pushUnique(docs, {
        containerId: r.container_id,
        containerNumber: r.container_number,
        detail: "No documents uploaded yet",
      });
    }
  }

  const msgsByRequest = new Map<string, ReportMessage[]>();
  for (const m of messages) {
    const r = m.container_id
      ? requestForContainer(m.container_id)
      : firstRequestForShipment(m.shipment_id);
    if (!r || !mineIds.has(r.id)) continue;
    const list = msgsByRequest.get(r.id) ?? [];
    list.push(m);
    msgsByRequest.set(r.id, list);
  }

  for (const r of mine) {
    const list = msgsByRequest.get(r.id) ?? [];
    if (list.length === 0) continue;
    const sorted = [...list].sort(
      (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at),
    );
    const last = sorted[sorted.length - 1];
    const lastIsCustomer =
      last.author_kind === "customer" && !last.is_internal;
    if (lastIsCustomer && r.container_id) {
      pushUnique(customer, {
        containerId: r.container_id,
        containerNumber: r.container_number,
        detail: "Latest message is from the customer — reply when you can",
      });
    }
    for (const m of sorted) {
      if (m.author_kind !== "customer" || m.is_internal) continue;
      if (ANGRY_HINTS.test(m.body)) {
        if (r.container_id) {
          pushUnique(customer, {
            containerId: r.container_id,
            containerNumber: r.container_number,
            detail: "Strong tone or urgency in a customer message",
          });
        }
        break;
      }
    }
  }

  return [
    {
      key: "exceptions",
      label: "Exceptions",
      hint: "Sync failures, carrier exceptions, critical alerts",
      rows: exceptions,
    },
    {
      key: "eta",
      label: "ETAs slipping",
      hint: "Delays, past carrier ETAs on active shipments",
      rows: etas,
    },
    {
      key: "docs",
      label: "Missing docs",
      hint: "Active shipments older than 24h with no uploads",
      rows: docs,
    },
    {
      key: "customer",
      label: "Customer threads",
      hint: "Needs a reply or heated wording",
      rows: customer,
    },
  ];
}

export function DashboardTriage(props: DashboardTriageProps) {
  const { userId, loading } = props;
  const buckets = buildTriageBuckets(props);

  const total = buckets.reduce((n, b) => n + b.rows.length, 0);

  if (loading) {
    return (
      <section
        className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
        aria-labelledby="triage-heading"
        aria-busy="true"
        aria-live="polite"
      >
        <h2 id="triage-heading" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Triage
        </h2>
        <div className="mt-6 flex min-h-30 items-center justify-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
          <span>Loading triage...</span>
        </div>
      </section>
    );
  }

  if (!userId) {
    return (
      <section
        className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
        aria-labelledby="triage-heading"
      >
        <h2 id="triage-heading" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Triage
        </h2>
        <p className="mt-2 text-sm text-zinc-500">Sign in to see what you are responsible for today.</p>
      </section>
    );
  }

  return (
    <section
      className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
      aria-labelledby="triage-heading"
    >
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h2 id="triage-heading" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Triage
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Scoped to shipments you own, lines assigned to you, or containers you collaborate on as a
            participant.
          </p>
        </div>
        {total === 0 ? (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">All clear</span>
        ) : (
          <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
            {total} {total === 1 ? "item" : "items"}
          </span>
        )}
      </div>

      {total > 0 ? (
        <p className="mb-4 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
          {buckets.map((b) => (
            <span key={b.key}>
              <span className="font-medium text-zinc-700 dark:text-zinc-300">{b.label}:</span> {b.rows.length}
            </span>
          ))}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {buckets.map((b) => (
          <div
            key={b.key}
            className="flex min-h-32 flex-col rounded-lg border border-zinc-100 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-900/40"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-200">
                {b.label}
              </h3>
              <span
                className={
                  b.rows.length === 0
                    ? "inline-flex min-w-5 justify-center rounded-full bg-zinc-200/80 px-1.5 py-px text-[10px] font-semibold tabular-nums text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    : b.key === "exceptions"
                      ? "inline-flex min-w-5 justify-center rounded-full bg-red-100 px-1.5 py-px text-[10px] font-semibold tabular-nums text-red-800 dark:bg-red-950/80 dark:text-red-200"
                      : "inline-flex min-w-5 justify-center rounded-full bg-amber-100 px-1.5 py-px text-[10px] font-semibold tabular-nums text-amber-900 dark:bg-amber-950/60 dark:text-amber-200"
                }
                aria-label={`${b.rows.length} in ${b.label}`}
              >
                {b.rows.length}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">{b.hint}</p>
            <ul className="mt-2 flex flex-1 flex-col gap-1.5 text-sm">
              {b.rows.length === 0 ? (
                <li className="text-xs text-zinc-400 dark:text-zinc-500">None right now.</li>
              ) : (
                b.rows.slice(0, 5).map((row, i) => (
                  <li key={`${row.containerId}-${b.key}-${i}`}>
                    <Link
                      href={`/containers/${row.containerId}`}
                      className="group block rounded-md px-1 py-0.5 -mx-1 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/80"
                    >
                      <span className="font-mono text-xs font-medium text-zinc-900 group-hover:underline dark:text-zinc-100">
                        {row.containerNumber}
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-zinc-600 dark:text-zinc-400">
                        {row.detail}
                      </span>
                    </Link>
                  </li>
                ))
              )}
              {b.rows.length > 5 ? (
                <li className="text-[11px] text-zinc-500">+{b.rows.length - 5} more</li>
              ) : null}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
