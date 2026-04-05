import type { SupabaseClient } from "@supabase/supabase-js";
import type { TrackingRequest } from "@/types/database";

export type OperatorRequestScope = "all" | "mine" | "unassigned" | "participating";

export type SortDirection = "asc" | "desc";

/** Columns allowed for server-side ordering on `tracking_requests`. */
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
