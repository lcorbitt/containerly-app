import type { Alert, Container, ReportMessage, TrackingRequest } from "@/types/database";
import { isRequestInMyScope } from "@/utils/dashboard-scope";

export const STALE_SYNC_MS = 48 * 60 * 60 * 1000;
export const TRIAGE_BUCKET_KEYS = ["exceptions", "eta", "docs", "customer"] as const;
export type TriageBucketKey = (typeof TRIAGE_BUCKET_KEYS)[number];

const ANGRY_HINTS =
  /\b(urgent|asap|immediately|unacceptable|frustrated|angry|complaint|refund|legal|lawsuit|terrible|worst|where\s+is|still\s+waiting|no\s+one\s+respond|unprofessional)\b|[!?]{2,}/i;

export type ContainerRow = Pick<Container, "id" | "status" | "location" | "shipment_id">;

export type TriageRow = {
  containerId: string;
  containerNumber: string;
  detail: string;
  bucketKey: TriageBucketKey;
};

export type TriageBucket = {
  key: TriageBucketKey;
  label: string;
  hint: string;
  rows: TriageRow[];
};

export type DayCount = { start: number; count: number };

export type PersonalMetrics = {
  totalMine: number;
  active: number;
  assignedToMe: number;
  collaborating: number;
  failed: number;
  staleSync: number;
  ownedShipmentCount: number;
  unackedAlerts: number;
  needsAttention: number;
  statusCounts: Record<string, number>;
  statusOrder: readonly ("pending" | "syncing" | "active" | "completed" | "failed")[];
  statusLabels: Record<"pending" | "syncing" | "active" | "completed" | "failed", string>;
  createdByDay: DayCount[];
  maxCreated: number;
};

export type OrgDashboardMetrics = {
  shipmentCount: number;
  activeLines: number;
  completedLines: number;
  needsAttention: number;
  triageCounts: Record<TriageBucketKey, number>;
  workflowCounts: Record<string, number>;
  shipmentsCreatedByDay: DayCount[];
  linesCreatedByDay: DayCount[];
};

export type SpotlightShipment = {
  shipmentId: string;
  orderNumber: string | null;
  portOfLoading: string | null;
  portOfDestination: string | null;
  containerId: string;
  containerNumber: string;
  triageDetail: string;
  bucketKey: TriageBucketKey;
};

export function isWorkflowActiveStatus(status: string): boolean {
  return status === "pending" || status === "syncing" || status === "active";
}

function startOfUtcDay(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function buildDaySeries(now: number, days: number): number[] {
  const dayStarts: number[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    dayStarts.push(startOfUtcDay(d));
  }
  return dayStarts;
}

export function countByDay(
  items: readonly { created_at: string }[],
  dayStarts: readonly number[],
): DayCount[] {
  return dayStarts.map((start) => {
    const end = start + 86_400_000;
    let n = 0;
    for (const item of items) {
      const t = Date.parse(item.created_at);
      if (!Number.isNaN(t) && t >= start && t < end) n += 1;
    }
    return { start, count: n };
  });
}

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

export type BuildTriageBucketsInput = {
  userId: string | null;
  requests: TrackingRequest[];
  alerts: Alert[];
  containersById: Record<string, ContainerRow>;
  shipmentOwnerByShipmentId: Record<string, string | null>;
  shipmentAssigneeByShipmentId: Record<string, string | null>;
  attachmentCountByRequestId: Record<string, number>;
  messages: ReportMessage[];
  participatingShipmentIds: ReadonlySet<string>;
  /** When true, include all org requests instead of user scope. */
  orgWide?: boolean;
};

export function buildTriageBuckets(input: BuildTriageBucketsInput): TriageBucket[] {
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
    orgWide = false,
  } = input;

  const mine = orgWide
    ? requests.filter((r) => Boolean(r.container_id))
    : requests.filter((r) =>
        isRequestInMyScope(
          r,
          userId,
          participatingShipmentIds,
          containersById,
          shipmentOwnerByShipmentId,
          shipmentAssigneeByShipmentId,
        ),
      );
  const mineIds = new Set(mine.map((r) => r.id));

  const exceptions: TriageRow[] = [];
  const etas: TriageRow[] = [];
  const docs: TriageRow[] = [];
  const customer: TriageRow[] = [];

  const pushUnique = (list: TriageRow[], row: Omit<TriageRow, "bucketKey">, bucketKey: TriageBucketKey) => {
    if (list.some((x) => x.containerId === row.containerId && x.detail === row.detail)) return;
    list.push({ ...row, bucketKey });
  };

  const requestForContainer = (containerId: string | null | undefined) =>
    containerId ? mine.find((r) => r.container_id === containerId) : undefined;

  const firstRequestForShipment = (shipmentId: string | null | undefined) =>
    shipmentId
      ? mine.find((r) => r.container_id && containersById[r.container_id]?.shipment_id === shipmentId)
      : undefined;

  for (const r of mine) {
    const c = r.container_id ? containersById[r.container_id] : undefined;
    const st = (c?.status ?? "").toUpperCase();

    if (!r.container_id) continue;

    if (r.status === "failed" || r.error_message) {
      pushUnique(
        exceptions,
        {
          containerId: r.container_id,
          containerNumber: r.container_number,
          detail: r.error_message ? `Sync issue: ${r.error_message.slice(0, 80)}` : "Tracking sync failed",
        },
        "exceptions",
      );
    }

    if (st.includes("EXCEPTION")) {
      pushUnique(
        exceptions,
        {
          containerId: r.container_id,
          containerNumber: r.container_number,
          detail: c?.status ? `Carrier status: ${c.status}` : "Exception reported on container",
        },
        "exceptions",
      );
    }
  }

  for (const a of alerts) {
    if (!a.container_id) continue;
    const r = requestForContainer(a.container_id);
    if (!r || !mineIds.has(r.id)) continue;
    if (a.alert_type === "STATUS_EXCEPTION" || a.severity === "critical") {
      pushUnique(
        exceptions,
        {
          containerId: a.container_id,
          containerNumber: r.container_number,
          detail: a.message,
        },
        "exceptions",
      );
    }
    if (a.alert_type === "SHIPMENT_DELAYED") {
      pushUnique(
        etas,
        {
          containerId: a.container_id,
          containerNumber: r.container_number,
          detail: a.message,
        },
        "eta",
      );
    }
  }

  for (const r of mine) {
    if (!isWorkflowActiveStatus(r.status) || !r.container_id) continue;
    const c = containersById[r.container_id];
    const st = (c?.status ?? "").toUpperCase();
    if (st.includes("DELAY")) {
      pushUnique(
        etas,
        {
          containerId: r.container_id,
          containerNumber: r.container_number,
          detail: "Carrier marked shipment as delayed",
        },
        "eta",
      );
    }
    const loc = c?.location as Record<string, unknown> | null | undefined;
    if (locationEtaSlipped(loc)) {
      pushUnique(
        etas,
        {
          containerId: r.container_id,
          containerNumber: r.container_number,
          detail: "Carrier ETA is in the past — confirm latest milestone",
        },
        "eta",
      );
    }
  }

  const dayMs = 86_400_000;
  const now = Date.now();
  for (const r of mine) {
    if (!isWorkflowActiveStatus(r.status)) continue;
    const created = Date.parse(r.created_at);
    if (Number.isNaN(created) || now - created < dayMs) continue;
    if (!r.container_id) continue;
    const n = attachmentCountByRequestId[r.id] ?? 0;
    if (n === 0) {
      pushUnique(
        docs,
        {
          containerId: r.container_id,
          containerNumber: r.container_number,
          detail: "No documents uploaded yet",
        },
        "docs",
      );
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
    const sorted = [...list].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
    const last = sorted[sorted.length - 1];
    const lastIsCustomer = last.author_kind === "customer" && !last.is_internal;
    if (lastIsCustomer && r.container_id) {
      pushUnique(
        customer,
        {
          containerId: r.container_id,
          containerNumber: r.container_number,
          detail: "Latest message is from the customer — reply when you can",
        },
        "customer",
      );
    }
    for (const m of sorted) {
      if (m.author_kind !== "customer" || m.is_internal) continue;
      if (ANGRY_HINTS.test(m.body)) {
        if (r.container_id) {
          pushUnique(
            customer,
            {
              containerId: r.container_id,
              containerNumber: r.container_number,
              detail: "Strong tone or urgency in a customer message",
            },
            "customer",
          );
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

export function triageCountsFromBuckets(buckets: TriageBucket[]): Record<TriageBucketKey, number> {
  return {
    exceptions: buckets.find((b) => b.key === "exceptions")?.rows.length ?? 0,
    eta: buckets.find((b) => b.key === "eta")?.rows.length ?? 0,
    docs: buckets.find((b) => b.key === "docs")?.rows.length ?? 0,
    customer: buckets.find((b) => b.key === "customer")?.rows.length ?? 0,
  };
}

export function flattenTriageRows(buckets: TriageBucket[]): TriageRow[] {
  const priority: TriageBucketKey[] = ["exceptions", "eta", "docs", "customer"];
  const rows: TriageRow[] = [];
  for (const key of priority) {
    const bucket = buckets.find((b) => b.key === key);
    if (bucket) rows.push(...bucket.rows);
  }
  return rows;
}

export function pickSpotlightFromTriage(
  buckets: TriageBucket[],
  shipmentCommercialById: Record<
    string,
    { orderNumber: string | null; portOfLoading: string | null; portOfDestination: string | null }
  >,
  containersById: Record<string, ContainerRow>,
): SpotlightShipment | null {
  const rows = flattenTriageRows(buckets);
  const first = rows[0];
  if (!first) return null;
  const shipmentId = containersById[first.containerId]?.shipment_id;
  if (!shipmentId) return null;
  const commercial = shipmentCommercialById[shipmentId];
  return {
    shipmentId,
    orderNumber: commercial?.orderNumber ?? null,
    portOfLoading: commercial?.portOfLoading ?? null,
    portOfDestination: commercial?.portOfDestination ?? null,
    containerId: first.containerId,
    containerNumber: first.containerNumber,
    triageDetail: first.detail,
    bucketKey: first.bucketKey,
  };
}

export type ComputePersonalMetricsInput = {
  mine: TrackingRequest[];
  mineIds: Set<string>;
  alerts: Alert[];
  containersById: Record<string, ContainerRow>;
  shipmentOwnerByShipmentId: Record<string, string | null | undefined>;
  shipmentAssigneeByShipmentId: Record<string, string | null | undefined>;
  participatingShipments: Set<string>;
  userId: string;
  now: number;
  triageBuckets: TriageBucket[];
};

export function computePersonalMetrics(input: ComputePersonalMetricsInput): PersonalMetrics {
  const {
    mine,
    mineIds,
    alerts,
    containersById,
    shipmentOwnerByShipmentId,
    shipmentAssigneeByShipmentId,
    participatingShipments,
    userId,
    now,
    triageBuckets,
  } = input;

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
    if (isWorkflowActiveStatus(r.status)) active += 1;
    if (r.status === "failed") failed += 1;
    const sidForScope = r.container_id ? containersById[r.container_id]?.shipment_id : undefined;
    if (sidForScope && shipmentAssigneeByShipmentId[sidForScope] === userId) assignedToMe += 1;
    const iOwnShipment = Boolean(sidForScope && shipmentOwnerByShipmentId[sidForScope] === userId);
    const iAmAssignee = Boolean(sidForScope && shipmentAssigneeByShipmentId[sidForScope] === userId);
    if (sidForScope && participatingShipments.has(sidForScope) && !iAmAssignee && !iOwnShipment) {
      collaborating += 1;
    }

    if (isWorkflowActiveStatus(r.status)) {
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

  const dayStarts = buildDaySeries(now, 14);
  const createdByDay = countByDay(mine, dayStarts);
  const maxCreated = Math.max(1, ...createdByDay.map((d) => d.count));

  const statusOrder = ["pending", "syncing", "active", "completed", "failed"] as const;
  const statusLabels: Record<(typeof statusOrder)[number], string> = {
    pending: "Pending",
    syncing: "Syncing",
    active: "Active",
    completed: "Completed",
    failed: "Failed",
  };

  const needsAttention = triageBuckets.reduce((n, b) => n + b.rows.length, 0);

  return {
    totalMine: mine.length,
    active,
    assignedToMe,
    collaborating,
    failed,
    staleSync,
    ownedShipmentCount: ownedShipmentIds.size,
    unackedAlerts,
    needsAttention,
    statusCounts,
    statusOrder,
    statusLabels,
    createdByDay,
    maxCreated,
  };
}

export const TRIAGE_BUCKET_LABELS: Record<TriageBucketKey, string> = {
  exceptions: "Exceptions",
  eta: "ETAs slipping",
  docs: "Missing docs",
  customer: "Customer threads",
};
