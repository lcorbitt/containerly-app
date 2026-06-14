"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import type { Alert, Container, ShipmentMessage, TrackingRequest } from "@/types/database";
import {
  buildTriageBuckets,
  type TriageBucket,
  type TriageRow,
} from "@/utils/dashboard-metrics";

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
  messages: ShipmentMessage[];
  /** Shipment IDs where the current user is a `shipment_participants` row. */
  participatingShipmentIds: ReadonlySet<string>;
};

export type { TriageBucket, TriageRow };

/** Shared with dashboard overview so triage counts stay consistent. */
export function buildTriageBucketsFromProps(props: DashboardTriageProps): TriageBucket[] {
  return buildTriageBuckets({
    userId: props.userId,
    requests: props.requests,
    alerts: props.alerts,
    containersById: props.containersById,
    shipmentOwnerByShipmentId: props.shipmentOwnerByShipmentId,
    shipmentAssigneeByShipmentId: props.shipmentAssigneeByShipmentId,
    attachmentCountByRequestId: props.attachmentCountByRequestId,
    messages: props.messages,
    participatingShipmentIds: props.participatingShipmentIds,
  });
}

export function DashboardTriage(props: DashboardTriageProps) {
  const { userId, loading } = props;
  const buckets = buildTriageBucketsFromProps(props);

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
