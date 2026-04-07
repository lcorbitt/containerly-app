import { createClient } from "@/lib/supabase/client";
import { isRequestInMyScope } from "@/utils/dashboard-scope";
import type { Alert, Container, ReportMessage, TrackingRequest } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CreateTrackingRequestBody,
  CreateTrackingRequestResponse,
  SyncContainerBody,
} from "@shared/dto/tracking.dto";

// ---------------------------------------------------------------------------
// Dashboard snapshot
// ---------------------------------------------------------------------------

export type TrackingDashboardSnapshot = {
  currentUserId: string | null;
  requests: TrackingRequest[];
  alerts: Alert[];
  triageContainersById: Record<string, Pick<Container, "id" | "status" | "location" | "shipment_id">>;
  triageAttachmentCounts: Record<string, number>;
  triageMessages: ReportMessage[];
  participatingShipmentIds: string[];
  shipmentOwnerByShipmentId: Record<string, string | null>;
  shipmentAssigneeByShipmentId: Record<string, string | null>;
};

export async function fetchTrackingDashboardSnapshot(
  organizationId: string,
): Promise<TrackingDashboardSnapshot> {
  const supabase = createClient();
  const { data: authData } = await supabase.auth.getUser();
  const uid = authData.user?.id ?? null;

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

  if (list.length === 0) {
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
  };
}

// ---------------------------------------------------------------------------
// Recent tracking requests (browser)
// ---------------------------------------------------------------------------

export async function fetchRecentTrackingRequestsForOrganization(
  organizationId: string,
  limit = 50,
): Promise<TrackingRequest[]> {
  const supabase = createClient();
  const { data: tr, error } = await supabase
    .from("tracking_requests")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (tr as TrackingRequest[]) ?? [];
}

// ---------------------------------------------------------------------------
// Operator tracking-requests page (server-side sorting / filtering)
// ---------------------------------------------------------------------------

export type OperatorRequestScope = "all" | "mine" | "unassigned" | "participating";

export type SortDirection = "asc" | "desc";

export const OPERATOR_REQUEST_SORT_COLUMNS = [
  "container_number",
  "status",
  "created_at",
  "last_sync_at",
] as const;

export type OperatorRequestSortColumn = (typeof OPERATOR_REQUEST_SORT_COLUMNS)[number];

export function normalizeOperatorSortColumn(raw: string | null): OperatorRequestSortColumn {
  if (raw && (OPERATOR_REQUEST_SORT_COLUMNS as readonly string[]).includes(raw)) {
    return raw as OperatorRequestSortColumn;
  }
  return "created_at";
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

// ---------------------------------------------------------------------------
// Edge Function calls (browser-side)
// ---------------------------------------------------------------------------

function requireEnv(): { base: string; anon: string } {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !anon) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required");
  }
  return { base: base.replace(/\/$/, ""), anon };
}

async function callEdgeFunction(name: string, body: Record<string, unknown>): Promise<unknown> {
  const { base, anon } = requireEnv();
  const supabase = createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Not signed in");

  const res = await fetch(`${base}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anon,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let parsed: unknown = text;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    /* leave as text */
  }

  if (!res.ok) {
    const o = parsed as { msg?: string; error?: string };
    throw new Error((o?.msg ?? o?.error ?? text) || res.statusText);
  }

  return parsed;
}

export async function createTrackingRequest(
  args: CreateTrackingRequestBody,
): Promise<CreateTrackingRequestResponse> {
  const body: Record<string, unknown> = {
    organization_id: args.organization_id,
    container_number: args.container_number,
    run_sync: args.run_sync !== false,
  };
  if (args.shipment_group_id != null && args.shipment_group_id !== "")
    body.shipment_group_id = args.shipment_group_id;
  if (args.source_bill_of_lading?.trim())
    body.source_bill_of_lading = args.source_bill_of_lading.trim();
  if (args.shipping_line?.trim()) body.shipping_line = args.shipping_line.trim();
  if (args.shipment_id != null && args.shipment_id !== "")
    body.shipment_id = args.shipment_id.trim();
  if (args.shipment_reference?.trim())
    body.shipment_reference = args.shipment_reference.trim();

  const raw = (await callEdgeFunction("create-tracking-request", body)) as CreateTrackingRequestResponse;
  if (raw?.sync_error) throw new Error(raw.sync_error);
  return raw;
}

export async function syncContainer(args: SyncContainerBody): Promise<unknown> {
  return callEdgeFunction("sync-container", args as unknown as Record<string, unknown>);
}
