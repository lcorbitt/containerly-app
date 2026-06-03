import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isRequestInMyScope } from "@/utils/dashboard-scope";
import type { Alert, Container, ReportMessage, TrackingRequest } from "@/types/database";
import type { TrackingDashboardSnapshot } from "@/types/tracking-dashboard-snapshot";
import {
  buildDaySeries,
  buildTriageBuckets,
  buildTriageActionContextByContainerId,
  collectDelayedCarrierLines,
  collectTriageShipmentIds,
  countByDay,
  pickSpotlightFromTriage,
  triageCountsFromBuckets,
  type OrgDashboardMetrics,
  type ShipmentCommercialSummary,
} from "@/utils/dashboard-metrics";
import { buildPerformanceInsights } from "@/utils/shipment-metrics";
import type { PerformanceInsights } from "@shared/dto/performance.dto";
import type {
  OperatorRequestScope,
  OperatorRequestSortColumn,
  SortDirection,
} from "@/utils/operator-tracking-requests";

export type { TrackingDashboardSnapshot };
export type { OperatorRequestScope, OperatorRequestSortColumn, SortDirection };

async function buildOrgPerformanceInsights(
  supabase: SupabaseClient,
  organizationId: string,
  delayedCarrierLines: import("@/utils/dashboard-metrics").DelayCarrierLineRow[],
): Promise<PerformanceInsights> {
  const [
    { data: shipmentRows },
    { data: activityRows },
    { data: msgRows },
  ] = await Promise.all([
    supabase
      .from("shipments")
      .select("id, workflow_status, created_at, order_number, customer_name")
      .eq("organization_id", organizationId),
    supabase
      .from("shipment_activity_events")
      .select("shipment_id, event_type, occurred_at")
      .eq("organization_id", organizationId)
      .in("event_type", ["drafts_attached", "documents_approved", "documents_rejected"])
      .order("occurred_at", { ascending: true })
      .limit(5000),
    supabase
      .from("report_messages")
      .select("shipment_id, container_id, author_kind, created_at, is_internal, body")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: true })
      .limit(5000),
  ]);

  const byShipment = new Map<
    string,
    {
      order_number: string | null;
      customer_name: string | null;
      last_message_at: string;
      last_message_preview: string;
      last_author_kind: string;
    }
  >();

  for (const row of msgRows ?? []) {
    const shipmentId = row.shipment_id as string | null;
    if (!shipmentId || row.container_id) continue;
    if (row.is_internal) continue;
    const existing = byShipment.get(shipmentId);
    if (existing) continue;
    byShipment.set(shipmentId, {
      order_number: null,
      customer_name: null,
      last_message_at: row.created_at as string,
      last_message_preview: typeof row.body === "string" ? row.body.slice(0, 120) : "",
      last_author_kind: typeof row.author_kind === "string" ? row.author_kind : "",
    });
  }

  for (const row of shipmentRows ?? []) {
    const id = row.id as string;
    const agg = byShipment.get(id);
    if (agg) {
      agg.order_number = (row.order_number as string | null) ?? null;
      agg.customer_name = (row.customer_name as string | null) ?? null;
    }
  }

  const messageThreads = [...byShipment.entries()].map(([shipment_id, agg]) => ({
    shipment_id,
    ...agg,
  }));

  return buildPerformanceInsights({
    delayedCarrierLines,
    shipments: (shipmentRows ?? []).map((row) => ({
      id: row.id as string,
      workflow_status: (row.workflow_status as string | null) ?? null,
      created_at: row.created_at as string,
    })),
    messages: (msgRows ?? []) as ReportMessage[],
    activityEvents: (activityRows ?? []).map((row) => ({
      shipment_id: row.shipment_id as string,
      event_type: row.event_type as string,
      occurred_at: row.occurred_at as string,
      metadata: {},
    })),
    messageThreads: messageThreads.map((t) => ({ ...t, message_count: 1 })),
  });
}

async function buildOrgDashboardMetrics(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<{ metrics: OrgDashboardMetrics; performanceInsights: PerformanceInsights }> {
  const now = Date.now();
  const dayStarts = buildDaySeries(now, 14);
  const sinceIso = new Date(dayStarts[0]).toISOString();

  const [
    { count: shipmentCount },
    { count: activeLines },
    { count: completedLines },
    { data: workflowRows },
    { data: shipmentRows },
    { data: lineRows },
    { data: orgRequests },
    { data: orgAlerts },
  ] = await Promise.all([
    supabase.from("shipments").select("*", { count: "exact", head: true }).eq("organization_id", organizationId),
    supabase
      .from("tracking_requests")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .in("status", ["pending", "syncing", "active"]),
    supabase
      .from("tracking_requests")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "completed"),
    supabase.from("shipments").select("workflow_status").eq("organization_id", organizationId),
    supabase
      .from("shipments")
      .select("created_at")
      .eq("organization_id", organizationId)
      .gte("created_at", sinceIso),
    supabase
      .from("tracking_requests")
      .select("created_at")
      .eq("organization_id", organizationId)
      .gte("created_at", sinceIso),
    supabase
      .from("tracking_requests")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("alerts")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  const workflowCounts: Record<string, number> = {};
  for (const row of workflowRows ?? []) {
    const key = (row.workflow_status as string | null) ?? "unknown";
    workflowCounts[key] = (workflowCounts[key] ?? 0) + 1;
  }

  const orgList = (orgRequests as TrackingRequest[]) ?? [];
  const orgAlertList = (orgAlerts as Alert[]) ?? [];
  const orgContainerIds = [
    ...new Set(orgList.map((r) => r.container_id).filter((id): id is string => Boolean(id))),
  ];

  const orgContainersById: Record<
    string,
    Pick<Container, "id" | "status" | "location" | "shipment_id" | "carrier">
  > = {};
  if (orgContainerIds.length > 0) {
    const { data: contRows } = await supabase
      .from("containers")
      .select("id, status, location, shipment_id, carrier")
      .in("id", orgContainerIds);
    for (const row of (contRows ?? []) as Pick<
      Container,
      "id" | "status" | "location" | "shipment_id" | "carrier"
    >[]) {
      orgContainersById[row.id] = row;
    }
  }

  const orgShipmentIds = [
    ...new Set(
      Object.values(orgContainersById)
        .map((c) => c.shipment_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const shipmentCarriersById: Record<
    string,
    { freight_booking_carrier: string | null; shipping_line: string | null }
  > = {};
  if (orgShipmentIds.length > 0) {
    const { data: carrierRows } = await supabase
      .from("shipments")
      .select("id, freight_booking_carrier, shipping_line")
      .in("id", orgShipmentIds);
    for (const row of carrierRows ?? []) {
      shipmentCarriersById[row.id as string] = {
        freight_booking_carrier: (row.freight_booking_carrier as string | null) ?? null,
        shipping_line: (row.shipping_line as string | null) ?? null,
      };
    }
  }

  const delayedCarrierLines = collectDelayedCarrierLines({
    requests: orgList,
    containersById: orgContainersById,
    alerts: orgAlertList,
    shipmentCarriersById,
  });

  let orgAttachmentCounts: Record<string, number> = {};
  let orgMessages: ReportMessage[] = [];
  if (orgContainerIds.length > 0) {
    const { data: attRows } = await supabase
      .from("workspace_attachments")
      .select("container_id")
      .in("container_id", orgContainerIds);
    const requestByContainer = new Map<string, string>();
    for (const r of orgList) {
      if (r.container_id) requestByContainer.set(r.container_id, r.id);
    }
    const counts: Record<string, number> = {};
    for (const row of attRows ?? []) {
      const cid = row.container_id as string;
      const rid = requestByContainer.get(cid);
      if (!rid) continue;
      counts[rid] = (counts[rid] ?? 0) + 1;
    }
    orgAttachmentCounts = counts;

    const [{ data: msgRows }, { data: msgShipmentRows }] = await Promise.all([
      supabase
        .from("report_messages")
        .select("*")
        .in("container_id", orgContainerIds)
        .order("created_at", { ascending: true })
        .limit(2000),
      orgShipmentIds.length > 0
        ? supabase
            .from("report_messages")
            .select("*")
            .in("shipment_id", orgShipmentIds)
            .is("container_id", null)
            .order("created_at", { ascending: true })
            .limit(500)
        : Promise.resolve({ data: [] as ReportMessage[] }),
    ]);
    orgMessages = [...(msgRows ?? []), ...(msgShipmentRows ?? [])].sort(
      (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at),
    ) as ReportMessage[];
  }

  const orgBuckets = buildTriageBuckets({
    userId: null,
    requests: orgList,
    alerts: orgAlertList,
    containersById: orgContainersById,
    shipmentOwnerByShipmentId: {},
    shipmentAssigneeByShipmentId: {},
    attachmentCountByRequestId: orgAttachmentCounts,
    messages: orgMessages,
    participatingShipmentIds: new Set(),
    orgWide: true,
  });
  const triageCounts = triageCountsFromBuckets(orgBuckets);
  const needsAttention = Object.values(triageCounts).reduce((n, c) => n + c, 0);

  const performanceInsights = await buildOrgPerformanceInsights(
    supabase,
    organizationId,
    delayedCarrierLines,
  );

  return {
    metrics: {
      shipmentCount: shipmentCount ?? 0,
      activeLines: activeLines ?? 0,
      completedLines: completedLines ?? 0,
      needsAttention,
      triageCounts,
      workflowCounts,
      shipmentsCreatedByDay: countByDay((shipmentRows ?? []) as { created_at: string }[], dayStarts),
      linesCreatedByDay: countByDay((lineRows ?? []) as { created_at: string }[], dayStarts),
    },
    performanceInsights,
  };
}

export async function buildTrackingDashboardSnapshot(
  supabase: SupabaseClient,
  organizationId: string,
  uid: string | null,
  options?: { includeOrgMetrics?: boolean },
): Promise<TrackingDashboardSnapshot> {
  const [{ data: tr }, { data: al }] = await Promise.all([
    supabase
      .from("tracking_requests")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("alerts")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);
  const list = (tr as TrackingRequest[]) ?? [];
  const alerts = (al as Alert[]) ?? [];

  const includeOrgMetrics = options?.includeOrgMetrics ?? false;
  const orgBundlePromise = includeOrgMetrics
    ? buildOrgDashboardMetrics(supabase, organizationId)
    : Promise.resolve(undefined);

  if (list.length === 0) {
    const orgBundle = await orgBundlePromise;
    return {
      currentUserId: uid,
      requests: list,
      alerts,
      triageContainersById: {},
      triageAttachmentCounts: {},
      triageMessages: [],
      participatingShipmentIds: [],
      shipmentOwnerByShipmentId: {},
      shipmentAssigneeByShipmentId: {},
      orgMetrics: orgBundle?.metrics,
      performanceInsights: orgBundle?.performanceInsights,
      spotlightShipment: null,
      triageActionContextByContainerId: {},
    };
  }

  const participatingShipments: string[] = [];
  if (uid) {
    const { data: partRows } = await supabase
      .from("shipment_participants")
      .select("shipment_id")
      .eq("user_id", uid);
    for (const row of partRows ?? []) {
      participatingShipments.push(row.shipment_id as string);
    }
  }
  const participatingShipmentIds = [...new Set(participatingShipments)];

  const containerIds = [
    ...new Set(list.map((r) => r.container_id).filter((id): id is string => Boolean(id))),
  ];

  const map: Record<string, Pick<Container, "id" | "status" | "location" | "shipment_id">> = {};
  if (containerIds.length > 0) {
    const { data: contRows } = await supabase
      .from("containers")
      .select("id, status, location, shipment_id")
      .in("id", containerIds);
    for (const row of (contRows ?? []) as Pick<
      Container,
      "id" | "status" | "location" | "shipment_id"
    >[]) {
      map[row.id] = row;
    }
  }

  const shipmentIds = [...new Set(Object.values(map).map((c) => c.shipment_id).filter(Boolean))];
  const owners: Record<string, string | null> = {};
  const assignees: Record<string, string | null> = {};
  if (shipmentIds.length > 0) {
    const { data: shipRows } = await supabase
      .from("shipments")
      .select("id, created_by, assignee_user_id")
      .in("id", shipmentIds);
    for (const row of shipRows ?? []) {
      owners[row.id as string] = (row.created_by as string | null) ?? null;
      assignees[row.id as string] = (row.assignee_user_id as string | null) ?? null;
    }
  }

  const participatingSet = new Set(participatingShipments);
  const myScopeIds = list
    .filter((r) => isRequestInMyScope(r, uid, participatingSet, map, owners, assignees))
    .map((r) => r.id);

  let triageAttachmentCounts: Record<string, number> = {};
  let triageMessages: ReportMessage[] = [];

  if (myScopeIds.length > 0) {
    const containerIdByRequest = new Map<string, string>();
    for (const r of list) {
      if (r.container_id) containerIdByRequest.set(r.id, r.container_id);
    }
    const myScopeContainerIds = [
      ...new Set(
        myScopeIds.map((rid) => containerIdByRequest.get(rid)).filter((id): id is string => Boolean(id)),
      ),
    ];

    const { data: attRows } = await supabase
      .from("workspace_attachments")
      .select("container_id")
      .in("container_id", myScopeContainerIds);
    const requestByContainer = new Map<string, string>();
    for (const r of list) {
      if (r.container_id) requestByContainer.set(r.container_id, r.id);
    }
    const counts: Record<string, number> = {};
    for (const row of attRows ?? []) {
      const cid = row.container_id as string;
      const rid = requestByContainer.get(cid);
      if (!rid) continue;
      counts[rid] = (counts[rid] ?? 0) + 1;
    }
    triageAttachmentCounts = counts;

    const shipmentIdsForScope = [
      ...new Set(
        myScopeContainerIds
          .map((cid) => map[cid]?.shipment_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const [{ data: msgRows }, { data: msgShipmentRows }] = await Promise.all([
      supabase
        .from("report_messages")
        .select("*")
        .in("container_id", myScopeContainerIds)
        .order("created_at", { ascending: true })
        .limit(2000),
      shipmentIdsForScope.length > 0
        ? supabase
            .from("report_messages")
            .select("*")
            .in("shipment_id", shipmentIdsForScope)
            .is("container_id", null)
            .order("created_at", { ascending: true })
            .limit(500)
        : Promise.resolve({ data: [] as ReportMessage[] }),
    ]);

    const merged = [...(msgRows ?? []), ...(msgShipmentRows ?? [])].sort(
      (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at),
    );
    triageMessages = merged as ReportMessage[];
  }

  const personalBuckets = buildTriageBuckets({
    userId: uid,
    requests: list,
    alerts,
    containersById: map,
    shipmentOwnerByShipmentId: owners,
    shipmentAssigneeByShipmentId: assignees,
    attachmentCountByRequestId: triageAttachmentCounts,
    messages: triageMessages,
    participatingShipmentIds: participatingSet,
  });

  const triageShipmentIds = collectTriageShipmentIds(personalBuckets, map);
  const shipmentCommercialById: Record<string, ShipmentCommercialSummary> = {};
  if (triageShipmentIds.length > 0) {
    const { data: shipCommercialRows } = await supabase
      .from("shipments")
      .select("id, order_number, customer_name, port_of_loading, port_of_destination, workflow_status")
      .in("id", triageShipmentIds);
    for (const row of shipCommercialRows ?? []) {
      shipmentCommercialById[row.id as string] = {
        orderNumber: (row.order_number as string | null) ?? null,
        customerName: (row.customer_name as string | null) ?? null,
        portOfLoading: (row.port_of_loading as string | null) ?? null,
        portOfDestination: (row.port_of_destination as string | null) ?? null,
        workflowStatus: (row.workflow_status as string | null) ?? null,
      };
    }
  }

  const triageActionContextByContainerId = buildTriageActionContextByContainerId({
    buckets: personalBuckets,
    containersById: map,
    shipmentCommercialById,
    requests: list,
  });

  const orgBundle = await orgBundlePromise;

  return {
    currentUserId: uid,
    requests: list,
    alerts,
    triageContainersById: map,
    triageAttachmentCounts,
    triageMessages,
    participatingShipmentIds,
    shipmentOwnerByShipmentId: owners,
    shipmentAssigneeByShipmentId: assignees,
    orgMetrics: orgBundle?.metrics,
    performanceInsights: orgBundle?.performanceInsights,
    spotlightShipment: pickSpotlightFromTriage(personalBuckets, shipmentCommercialById, map),
    triageActionContextByContainerId,
  };
}

export async function fetchRecentTrackingRequestsForOrganizationQuery(
  supabase: SupabaseClient,
  organizationId: string,
  limit = 50,
): Promise<TrackingRequest[]> {
  const { data: tr, error } = await supabase
    .from("tracking_requests")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (tr as TrackingRequest[]) ?? [];
}

function sanitizeIlikeTerm(term: string): string {
  return term.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export async function fetchOperatorTrackingRequestsPage(
  supabase: SupabaseClient,
  args: {
    organizationId: string;
    userId: string | null;
    scope: OperatorRequestScope;
    page: number;
    pageSize: number;
    sortColumn: OperatorRequestSortColumn;
    sortDirection: SortDirection;
    search: string;
  },
): Promise<{ rows: TrackingRequest[]; totalCount: number }> {
  const {
    organizationId,
    userId,
    scope,
    page,
    pageSize,
    sortColumn,
    sortDirection,
    search,
  } = args;

  let allowedContainerIds: string[] | null = null;

  if (scope === "participating") {
    if (!userId) {
      return { rows: [], totalCount: 0 };
    }
    const { data: spRows, error: spErr } = await supabase
      .from("shipment_participants")
      .select("shipment_id")
      .eq("user_id", userId);
    if (spErr) throw new Error(spErr.message);
    const shipmentIds = [...new Set((spRows ?? []).map((r) => r.shipment_id as string))];
    if (shipmentIds.length === 0) {
      return { rows: [], totalCount: 0 };
    }
    const { data: cRows, error: cErr } = await supabase
      .from("containers")
      .select("id")
      .eq("organization_id", organizationId)
      .in("shipment_id", shipmentIds);
    if (cErr) throw new Error(cErr.message);
    allowedContainerIds = [...new Set((cRows ?? []).map((r) => r.id as string))];
    if (allowedContainerIds.length === 0) {
      return { rows: [], totalCount: 0 };
    }
  } else if (scope === "mine") {
    if (!userId) {
      return { rows: [], totalCount: 0 };
    }
    const { data: shipRows, error: shErr } = await supabase
      .from("shipments")
      .select("id")
      .eq("organization_id", organizationId)
      .or(`created_by.eq.${userId},assignee_user_id.eq.${userId}`);
    if (shErr) throw new Error(shErr.message);
    const shipmentIds = [...new Set((shipRows ?? []).map((r) => r.id as string))];
    if (shipmentIds.length === 0) {
      return { rows: [], totalCount: 0 };
    }
    const { data: cRows, error: cErr } = await supabase
      .from("containers")
      .select("id")
      .eq("organization_id", organizationId)
      .in("shipment_id", shipmentIds);
    if (cErr) throw new Error(cErr.message);
    allowedContainerIds = [...new Set((cRows ?? []).map((r) => r.id as string))];
    if (allowedContainerIds.length === 0) {
      return { rows: [], totalCount: 0 };
    }
  } else if (scope === "unassigned") {
    const { data: shipRows, error: shErr } = await supabase
      .from("shipments")
      .select("id")
      .eq("organization_id", organizationId)
      .is("assignee_user_id", null);
    if (shErr) throw new Error(shErr.message);
    const shipmentIds = [...new Set((shipRows ?? []).map((r) => r.id as string))];
    if (shipmentIds.length === 0) {
      return { rows: [], totalCount: 0 };
    }
    const { data: cRows, error: cErr } = await supabase
      .from("containers")
      .select("id")
      .eq("organization_id", organizationId)
      .in("shipment_id", shipmentIds);
    if (cErr) throw new Error(cErr.message);
    allowedContainerIds = [...new Set((cRows ?? []).map((r) => r.id as string))];
    if (allowedContainerIds.length === 0) {
      return { rows: [], totalCount: 0 };
    }
  }

  let q = supabase
    .from("tracking_requests")
    .select("*, containers(shipment_id, shipments(assignee_user_id))", { count: "exact" })
    .eq("organization_id", organizationId);

  if (allowedContainerIds) {
    q = q.in("container_id", allowedContainerIds);
  }

  const term = search.trim();
  if (term) {
    const s = sanitizeIlikeTerm(term);
    q = q.or(
      `container_number.ilike.%${s}%,normalized_number.ilike.%${s}%,source_bill_of_lading.ilike.%${s}%`,
    );
  }

  q = q.order(sortColumn, { ascending: sortDirection === "asc" });
  const from = page * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await q.range(from, to);
  if (error) throw new Error(error.message);
  return { rows: (data as TrackingRequest[]) ?? [], totalCount: count ?? 0 };
}
