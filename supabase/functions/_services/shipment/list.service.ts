import type { SupabaseClient } from "@supabase/supabase-js";
import type { OperatorShipmentDateRangeFilter } from "@shared/operator-shipment-date-filters";
import type {
  ImporterGrantedShipmentSortColumn,
  SortDirection as ImporterSortDirection,
} from "@shared/importer-shipment-sort";
import type {
  OperatorShipmentScope,
  OperatorShipmentSortColumn,
  SortDirection,
} from "@shared/operator-shipment-sort";
import { sanitizeIlikeTerm } from "@shared/utils/sanitize-ilike";

export type ShipmentOverviewTrackingRow = {
  id: string;
  container_id: string | null;
  container_number: string;
  status: string;
  last_sync_at: string | null;
  created_at: string;
  error_message: string | null;
  source_bill_of_lading?: string | null;
  normalized_number?: string;
};

export type ShipmentOverviewRow = {
  id: string;
  organization_id: string;
  order_number: string;
  carrier_booking_number: string;
  container_number: string;
  customer_name: string | null;
  consignee: string | null;
  bill_of_lading: string | null;
  shipping_line: string | null;
  shipment_group_id: string | null;
  workflow_status: string | null;
  port_of_loading: string | null;
  port_of_destination: string | null;
  estimated_departure_at: string | null;
  estimated_arrival_at: string | null;
  created_at: string;
  owner_user_id: string | null;
  assignee_user_id: string | null;
  tags: string[];
  tracking_requests: ShipmentOverviewTrackingRow[] | ShipmentOverviewTrackingRow | null;
};

type RpcOverviewRow = {
  total_count: number | string;
  id: string;
  organization_id: string;
  order_number: string;
  carrier_booking_number: string;
  container_number: string;
  customer_name: string | null;
  consignee: string | null;
  bill_of_lading: string | null;
  shipping_line: string | null;
  shipment_group_id: string | null;
  workflow_status: string | null;
  port_of_loading: string | null;
  port_of_destination: string | null;
  estimated_departure_at: string | null;
  estimated_arrival_at: string | null;
  created_at: string;
  owner_user_id: string | null;
  assignee_user_id: string | null;
  tags: string[] | null;
  tracking_requests: unknown;
};

function parseTrackingRequestsJson(raw: unknown): ShipmentOverviewTrackingRow[] {
  if (raw == null || !Array.isArray(raw)) return [];
  return raw as ShipmentOverviewTrackingRow[];
}

function toOverviewRow(r: RpcOverviewRow): ShipmentOverviewRow {
  return {
    id: r.id,
    organization_id: r.organization_id,
    order_number: r.order_number,
    carrier_booking_number: r.carrier_booking_number,
    container_number: r.container_number,
    customer_name: r.customer_name,
    consignee: r.consignee,
    bill_of_lading: r.bill_of_lading,
    shipping_line: r.shipping_line,
    shipment_group_id: r.shipment_group_id,
    workflow_status: r.workflow_status,
    port_of_loading: r.port_of_loading,
    port_of_destination: r.port_of_destination,
    estimated_departure_at: r.estimated_departure_at,
    estimated_arrival_at: r.estimated_arrival_at,
    created_at: r.created_at,
    owner_user_id: r.owner_user_id,
    assignee_user_id: r.assignee_user_id,
    tags: Array.isArray(r.tags) ? r.tags : [],
    tracking_requests: parseTrackingRequestsJson(r.tracking_requests),
  };
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function fetchOperatorShipmentsOverviewPage(
  supabase: SupabaseClient,
  args: {
    organizationId: string;
    userId: string | null;
    scope: OperatorShipmentScope;
    search: string;
    tagFilter?: string | null;
    dateRangeFilter?: OperatorShipmentDateRangeFilter;
    sortColumn: OperatorShipmentSortColumn;
    sortDirection: SortDirection;
    page: number;
    pageSize: number;
  },
): Promise<{ rows: ShipmentOverviewRow[]; totalCount: number }> {
  const {
    organizationId,
    userId,
    scope,
    search,
    tagFilter,
    dateRangeFilter,
    sortColumn,
    sortDirection,
    page,
    pageSize,
  } = args;

  if (!UUID_RE.test(organizationId)) {
    throw new Error("Invalid organization_id");
  }

  const offset = Math.max(0, page) * pageSize;

  const rpcArgs: {
    p_organization_id: string;
    p_user_id: string | null;
    p_scope: string;
    p_search: string;
    p_sort_column: string;
    p_sort_asc: boolean;
    p_limit: number;
    p_offset: number;
    p_tag_filter?: string;
    p_eta_from?: string;
    p_eta_to?: string;
    p_etd_from?: string;
    p_etd_to?: string;
  } = {
    p_organization_id: organizationId,
    p_user_id: userId,
    p_scope: scope,
    p_search: search.trim(),
    p_sort_column: sortColumn,
    p_sort_asc: sortDirection === "asc",
    p_limit: pageSize,
    p_offset: offset,
  };

  const trimmedTag = tagFilter?.trim();
  if (trimmedTag) rpcArgs.p_tag_filter = trimmedTag;
  if (dateRangeFilter?.etaFrom) rpcArgs.p_eta_from = dateRangeFilter.etaFrom;
  if (dateRangeFilter?.etaTo) rpcArgs.p_eta_to = dateRangeFilter.etaTo;
  if (dateRangeFilter?.etdFrom) rpcArgs.p_etd_from = dateRangeFilter.etdFrom;
  if (dateRangeFilter?.etdTo) rpcArgs.p_etd_to = dateRangeFilter.etdTo;

  const { data, error } = await supabase.rpc("operator_shipments_overview_page", rpcArgs);
  if (error) throw new Error(error.message);

  const rawRows = (data as RpcOverviewRow[] | null) ?? [];
  if (rawRows.length === 0) {
    return { rows: [], totalCount: 0 };
  }

  const totalCount = Number(rawRows[0]!.total_count);
  return {
    rows: rawRows.map(toOverviewRow),
    totalCount: Number.isFinite(totalCount) ? totalCount : 0,
  };
}

export type DocumentQueueFilter =
  | "all"
  | "pending_drafts"
  | "awaiting_review"
  | "approved"
  | "rejected"
  | "originals_sent";

export type DocumentQueueRow = {
  id: string;
  order_number: string;
  customer_name: string | null;
  workflow_status: string | null;
  port_of_loading: string | null;
  port_of_destination: string | null;
  updated_at: string;
};

async function shipmentIdsForDocumentQueueScope(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string | null,
  scope: OperatorShipmentScope,
): Promise<string[] | null> {
  if (scope === "all") return null;
  if (!userId && scope !== "unassigned") return [];

  if (scope === "mine") {
    const { data, error } = await supabase
      .from("shipments")
      .select("id")
      .eq("organization_id", organizationId)
      .or(`created_by.eq.${userId},assignee_user_id.eq.${userId}`);
    if (error) throw new Error(error.message);
    return [...new Set((data ?? []).map((r) => r.id as string))];
  }

  if (scope === "unassigned") {
    const { data, error } = await supabase
      .from("shipments")
      .select("id")
      .eq("organization_id", organizationId)
      .is("assignee_user_id", null);
    if (error) throw new Error(error.message);
    return [...new Set((data ?? []).map((r) => r.id as string))];
  }

  const { data: spRows, error: spErr } = await supabase
    .from("shipment_participants")
    .select("shipment_id")
    .eq("user_id", userId!);
  if (spErr) throw new Error(spErr.message);
  const ids = [...new Set((spRows ?? []).map((r) => r.shipment_id as string))];
  if (ids.length === 0) return [];
  const { data: shipRows, error: shipErr } = await supabase
    .from("shipments")
    .select("id")
    .eq("organization_id", organizationId)
    .in("id", ids);
  if (shipErr) throw new Error(shipErr.message);
  return [...new Set((shipRows ?? []).map((r) => r.id as string))];
}

export async function fetchDocumentQueuePage(
  supabase: SupabaseClient,
  args: {
    organizationId: string;
    userId: string | null;
    scope: OperatorShipmentScope;
    workflowFilter: DocumentQueueFilter;
    search: string;
    page: number;
    pageSize: number;
  },
): Promise<{ rows: DocumentQueueRow[]; totalCount: number }> {
  const scopeIds = await shipmentIdsForDocumentQueueScope(
    supabase,
    args.organizationId,
    args.userId,
    args.scope,
  );
  if (scopeIds && scopeIds.length === 0) {
    return { rows: [], totalCount: 0 };
  }

  let q = supabase
    .from("shipments")
    .select(
      "id, order_number, customer_name, workflow_status, port_of_loading, port_of_destination, updated_at",
      { count: "exact" },
    )
    .eq("organization_id", args.organizationId);

  if (scopeIds) {
    q = q.in("id", scopeIds);
  }

  if (args.workflowFilter !== "all") {
    q = q.eq("workflow_status", args.workflowFilter);
  } else {
    q = q.not("workflow_status", "is", null);
  }

  const term = args.search.trim();
  if (term) {
    const s = sanitizeIlikeTerm(term);
    q = q.or(
      `order_number.ilike.%${s}%,customer_name.ilike.%${s}%,port_of_loading.ilike.%${s}%,port_of_destination.ilike.%${s}%`,
    );
  }

  q = q.order("updated_at", { ascending: false });
  const from = args.page * args.pageSize;
  const to = from + args.pageSize - 1;
  const { data, error, count } = await q.range(from, to);
  if (error) throw new Error(error.message);

  const rows: DocumentQueueRow[] = (data ?? []).map((row) => ({
    id: row.id as string,
    order_number: row.order_number as string,
    customer_name: (row.customer_name as string | null) ?? null,
    workflow_status: (row.workflow_status as string | null) ?? null,
    port_of_loading: (row.port_of_loading as string | null) ?? null,
    port_of_destination: (row.port_of_destination as string | null) ?? null,
    updated_at: row.updated_at as string,
  }));

  return { rows, totalCount: count ?? rows.length };
}

export type ImporterGrantedShipmentRow = {
  id: string;
  access_grant_id: string;
  organization_id: string;
  organization_name: string;
  order_number: string;
  customer_name: string | null;
  consignee: string | null;
  port_of_loading: string | null;
  port_of_destination: string | null;
  workflow_status: string | null;
  estimated_departure_at: string | null;
  estimated_arrival_at: string | null;
  created_at: string;
};

type RpcImporterOverviewRow = {
  total_count: number | string;
  access_grant_id: string;
  id: string;
  organization_id: string;
  organization_name: string;
  order_number: string;
  customer_name: string | null;
  consignee: string | null;
  port_of_loading: string | null;
  port_of_destination: string | null;
  workflow_status: string | null;
  estimated_departure_at: string | null;
  estimated_arrival_at: string | null;
  created_at: string;
};

function toImporterOverviewRow(r: RpcImporterOverviewRow): ImporterGrantedShipmentRow {
  return {
    id: r.id,
    access_grant_id: r.access_grant_id,
    organization_id: r.organization_id,
    organization_name: r.organization_name?.trim() || "—",
    order_number: r.order_number,
    customer_name: r.customer_name,
    consignee: r.consignee,
    port_of_loading: r.port_of_loading,
    port_of_destination: r.port_of_destination,
    workflow_status: r.workflow_status,
    estimated_departure_at: r.estimated_departure_at,
    estimated_arrival_at: r.estimated_arrival_at,
    created_at: r.created_at,
  };
}

async function mergeImporterOverviewScheduleFields(
  supabase: SupabaseClient,
  rows: ImporterGrantedShipmentRow[],
): Promise<void> {
  const needsSchedule = rows.some(
    (row) => row.estimated_departure_at == null || row.estimated_arrival_at == null,
  );
  if (!needsSchedule) return;

  const shipmentIds = rows.map((row) => row.id);
  const { data, error } = await supabase
    .from("shipments")
    .select("id, estimated_departure_at, estimated_arrival_at")
    .in("id", shipmentIds);
  if (error) throw new Error(error.message);

  const byId = new Map((data ?? []).map((row) => [row.id as string, row]));
  for (const row of rows) {
    const ship = byId.get(row.id);
    if (!ship) continue;
    if (row.estimated_departure_at == null) {
      row.estimated_departure_at = (ship.estimated_departure_at as string | null) ?? null;
    }
    if (row.estimated_arrival_at == null) {
      row.estimated_arrival_at = (ship.estimated_arrival_at as string | null) ?? null;
    }
  }
}

export async function fetchImporterGrantedShipmentsPage(
  supabase: SupabaseClient,
  args: {
    userId: string;
    page: number;
    pageSize: number;
    sortColumn: ImporterGrantedShipmentSortColumn;
    sortDirection: ImporterSortDirection;
    search: string;
    dateRangeFilter?: OperatorShipmentDateRangeFilter;
  },
): Promise<{ rows: ImporterGrantedShipmentRow[]; totalCount: number }> {
  const { userId, page, pageSize, sortColumn, sortDirection, search, dateRangeFilter } = args;
  const offset = Math.max(0, page) * pageSize;

  const { data, error } = await supabase.rpc("importer_granted_shipments_overview_page", {
    p_customer_user_id: userId,
    p_search: search.trim(),
    p_sort_column: sortColumn,
    p_sort_asc: sortDirection === "asc",
    p_limit: pageSize,
    p_offset: offset,
    p_eta_from: dateRangeFilter?.etaFrom ?? undefined,
    p_eta_to: dateRangeFilter?.etaTo ?? undefined,
    p_etd_from: dateRangeFilter?.etdFrom ?? undefined,
    p_etd_to: dateRangeFilter?.etdTo ?? undefined,
  });

  if (error) throw new Error(error.message);

  const rawRows = (data as RpcImporterOverviewRow[] | null) ?? [];
  if (rawRows.length === 0) {
    return { rows: [], totalCount: 0 };
  }

  const totalCount = Number(rawRows[0]!.total_count);
  const rows = rawRows.map(toImporterOverviewRow);
  await mergeImporterOverviewScheduleFields(supabase, rows);

  return { rows, totalCount: Number.isFinite(totalCount) ? totalCount : 0 };
}

export type ShipmentPickRow = {
  id: string;
  order_number: string;
  created_at: string;
};

export async function fetchShipmentPickRows(
  supabase: SupabaseClient,
  organizationId: string,
  limit: number,
): Promise<ShipmentPickRow[]> {
  const { data, error } = await supabase
    .from("shipments")
    .select("id, order_number, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data as ShipmentPickRow[]) ?? [];
}
