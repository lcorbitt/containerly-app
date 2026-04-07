"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Layers,
  Package,
  Radio,
  UserCheck,
  Users,
} from "lucide-react";
import type { Alert, Container, TrackingRequest } from "@/types/database";
import { isRequestInMyScope } from "@/utils/dashboard-scope";

const STALE_SYNC_MS = 48 * 60 * 60 * 1000;

type ContainerRow = Pick<Container, "id" | "status" | "location" | "shipment_id">;

export type DashboardPersonalOverviewProps = {
  userId: string | null;
  orgName: string | null;
  requests: TrackingRequest[];
  alerts: Alert[];
  containersById: Record<string, ContainerRow>;
  shipmentOwnerByShipmentId: Record<string, string | null>;
  shipmentAssigneeByShipmentId: Record<string, string | null>;
  participatingShipmentIds: readonly string[];
};

function isWorkflowActive(status: string): boolean {
  return status === "pending" || status === "syncing" || status === "active";
}

function startOfUtcDay(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function formatDayLabel(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

type MetricsInput = {
  mine: TrackingRequest[];
  mineIds: Set<string>;
  alerts: Alert[];
  containersById: Record<string, ContainerRow>;
  shipmentOwnerByShipmentId: Record<string, string | null | undefined>;
  shipmentAssigneeByShipmentId: Record<string, string | null | undefined>;
  participatingShipments: Set<string>;
  userId: string;
  now: number;
};

function computePersonalMetrics({
  mine,
  mineIds,
  alerts,
  containersById,
  shipmentOwnerByShipmentId,
  shipmentAssigneeByShipmentId,
  participatingShipments,
  userId,
  now,
}: MetricsInput) {
  let active = 0;
  let assignedToMe = 0;
  let collaborating = 0;
  let failed = 0;
  let staleSync = 0;
  const ownedShipmentIds = new Set<string>();
  const statusCounts: Record<string, number> = {
    pending: 0,
    syncing: 0,
    active: 0,
    completed: 0,
    failed: 0,
  };

  for (const r of mine) {
    statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1;
    if (isWorkflowActive(r.status)) active += 1;
    if (r.status === "failed") failed += 1;
    const sidForScope = r.container_id ? containersById[r.container_id]?.shipment_id : undefined;
    if (sidForScope && shipmentAssigneeByShipmentId[sidForScope] === userId) assignedToMe += 1;
    const iOwnShipment = Boolean(sidForScope && shipmentOwnerByShipmentId[sidForScope] === userId);
    const iAmAssignee = Boolean(sidForScope && shipmentAssigneeByShipmentId[sidForScope] === userId);
    if (
      sidForScope &&
      participatingShipments.has(sidForScope) &&
      !iAmAssignee &&
      !iOwnShipment
    ) {
      collaborating += 1;
    }

    if (isWorkflowActive(r.status)) {
      const last = r.last_sync_at ? Date.parse(r.last_sync_at) : NaN;
      if (Number.isNaN(last) || now - last > STALE_SYNC_MS) staleSync += 1;
    }

    const sid = r.container_id ? containersById[r.container_id]?.shipment_id : null;
    if (sid && shipmentOwnerByShipmentId[sid] === userId) ownedShipmentIds.add(sid);
  }

  const mineContainerIds = new Set(
    mine.map((r) => r.container_id).filter((id): id is string => Boolean(id)),
  );
  let unackedAlerts = 0;
  for (const a of alerts) {
    if (a.acknowledged_at) continue;
    if (!a.container_id || !mineContainerIds.has(a.container_id)) continue;
    unackedAlerts += 1;
  }

  const dayStarts: number[] = [];
  for (let i = 13; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    dayStarts.push(startOfUtcDay(d));
  }
  const createdByDay = dayStarts.map((start) => {
    const end = start + 86_400_000;
    let n = 0;
    for (const r of mine) {
      const t = Date.parse(r.created_at);
      if (!Number.isNaN(t) && t >= start && t < end) n += 1;
    }
    return { start, count: n };
  });
  const maxCreated = Math.max(1, ...createdByDay.map((d) => d.count));

  const statusOrder = ["pending", "syncing", "active", "completed", "failed"] as const;
  const statusLabels: Record<(typeof statusOrder)[number], string> = {
    pending: "Pending",
    syncing: "Syncing",
    active: "Active",
    completed: "Completed",
    failed: "Failed",
  };

  return {
    totalMine: mine.length,
    active,
    assignedToMe,
    collaborating,
    failed,
    staleSync,
    ownedShipmentCount: ownedShipmentIds.size,
    unackedAlerts,
    statusCounts,
    statusOrder,
    statusLabels,
    createdByDay,
    maxCreated,
  };
}

export function DashboardPersonalOverview({
  userId,
  orgName,
  requests,
  alerts,
  containersById,
  shipmentOwnerByShipmentId,
  shipmentAssigneeByShipmentId,
  participatingShipmentIds,
}: DashboardPersonalOverviewProps) {
  const participatingShipments = useMemo(
    () => new Set(participatingShipmentIds),
    [participatingShipmentIds],
  );

  const mine = useMemo(() => {
    if (!userId) return [];
    return requests.filter((r) =>
      isRequestInMyScope(
        r,
        userId,
        participatingShipments,
        containersById,
        shipmentOwnerByShipmentId,
        shipmentAssigneeByShipmentId,
      ),
    );
  }, [
    requests,
    userId,
    participatingShipments,
    containersById,
    shipmentOwnerByShipmentId,
    shipmentAssigneeByShipmentId,
  ]);

  const mineIds = useMemo(() => new Set(mine.map((r) => r.id)), [mine]);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const metrics = useMemo(() => {
    if (!userId) return null;
    return computePersonalMetrics({
      mine,
      mineIds,
      alerts,
      containersById,
      shipmentOwnerByShipmentId,
      shipmentAssigneeByShipmentId,
      participatingShipments,
      userId,
      now,
    });
  }, [
    mine,
    mineIds,
    alerts,
    containersById,
    shipmentOwnerByShipmentId,
    shipmentAssigneeByShipmentId,
    participatingShipments,
    userId,
    now,
  ]);

  if (!userId) {
    return (
      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Sign in to see your workload and metrics.</p>
      </section>
    );
  }

  if (!metrics) {
    return null;
  }

  const orgLine = orgName ? (
    <span className="text-zinc-500 dark:text-zinc-400"> · {orgName}</span>
  ) : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Your operations{orgLine}
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Lines on shipments you own, lines assigned to you, or lines where you are a participant. Tracking rows still log
          who created them for audit, but ownership is the shipment record.
        </p>
      </div>

      {/* <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<Layers className="h-4 w-4" />}
          label="Your tracking lines"
          value={metrics.totalMine}
          sub={
            metrics.active > 0
              ? `${metrics.active} active ${metrics.active === 1 ? "line" : "lines"} (pending / syncing / active)`
              : "None in progress"
          }
          tone="neutral"
        />
        <KpiCard
          icon={<Package className="h-4 w-4" />}
          label="Shipments you own"
          value={metrics.ownedShipmentCount}
          sub="In your scope (commercial shipment records)"
          tone="neutral"
        />
        <KpiCard
          icon={<UserCheck className="h-4 w-4" />}
          label="Assigned to you"
          value={metrics.assignedToMe}
          sub="Primary operator on the line"
          tone="neutral"
        />
        <KpiCard
          icon={<Users className="h-4 w-4" />}
          label="Collaborations"
          value={metrics.collaborating}
          sub="Participant, not assignee"
          tone="neutral"
        />
        <KpiCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Open alerts"
          value={metrics.unackedAlerts}
          sub="Unacknowledged on your lines"
          tone={metrics.unackedAlerts > 0 ? "warn" : "neutral"}
        />
        <KpiCard
          icon={<Radio className="h-4 w-4" />}
          label="Stale sync"
          value={metrics.staleSync}
          sub="Active lines, no sync in 48h"
          tone={metrics.staleSync > 0 ? "warn" : "neutral"}
        />
        <KpiCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Failed lines"
          value={metrics.failed}
          sub="Workflow status failed"
          tone={metrics.failed > 0 ? "bad" : "neutral"}
        />
        <Link
          href="/shipments"
          className="flex flex-col justify-between rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 p-4 transition hover:border-zinc-400 hover:bg-zinc-100/80 dark:border-zinc-600 dark:bg-zinc-900/30 dark:hover:border-zinc-500 dark:hover:bg-zinc-900/60"
        >
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Directory
          </span>
          <span className="mt-2 flex items-center gap-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            All shipments
            <ArrowRight className="h-4 w-4" aria-hidden />
          </span>
          <span className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Filter by My shipments, Unassigned, or Participating in the shipments list.
          </span>
        </Link>
      </div> */}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Your workflow status mix</h3>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Count of tracking lines in each state (your scope only).
          </p>
          <div className="mt-4 space-y-3">
            {metrics.statusOrder.map((key) => {
              const n = metrics.statusCounts[key] ?? 0;
              const max = Math.max(1, metrics.totalMine);
              const pct = metrics.totalMine === 0 ? 0 : Math.round((n / max) * 100);
              const barClass =
                key === "failed"
                  ? "bg-red-500 dark:bg-red-600"
                  : key === "active"
                    ? "bg-emerald-500 dark:bg-emerald-600"
                    : key === "syncing" || key === "pending"
                      ? "bg-sky-500 dark:bg-sky-600"
                      : "bg-zinc-300 dark:bg-zinc-600";
              return (
                <div key={key}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-zinc-600 dark:text-zinc-300">{metrics.statusLabels[key]}</span>
                    <span className="tabular-nums text-zinc-500 dark:text-zinc-400">{n}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div className={`h-2 rounded-full transition-all ${barClass}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">New lines (last 14 days)</h3>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            When container lines entered your scope (new sync rows in the org).
          </p>
          <div className="mt-4 flex h-36 items-end gap-1">
            {metrics.createdByDay.map((d) => {
              const h = Math.max(4, Math.round((d.count / metrics.maxCreated) * 100));
              return (
                <div key={d.start} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full max-w-8 rounded-t bg-sky-500/90 dark:bg-sky-600/90"
                    style={{ height: `${h}%` }}
                    title={`${d.count} on ${formatDayLabel(d.start)}`}
                  />
                  <span className="hidden text-[9px] text-zinc-400 sm:block">
                    {new Date(d.start).getUTCDate()}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-center text-[11px] text-zinc-400 dark:text-zinc-500">
            Bar height reflects lines opened that day; hover a bar for the exact count.
          </p>
        </section>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  sub: string;
  tone: "neutral" | "warn" | "bad";
}) {
  const ring =
    tone === "bad"
      ? "border-red-200/80 dark:border-red-900/50"
      : tone === "warn"
        ? "border-amber-200/80 dark:border-amber-900/40"
        : "border-zinc-200 dark:border-zinc-800";
  return (
    <div className={`rounded-xl border bg-white p-4 dark:bg-zinc-950 ${ring}`}>
      <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">{icon}</div>
      <p className="mt-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{sub}</p>
    </div>
  );
}
