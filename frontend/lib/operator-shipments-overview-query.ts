import type { SupabaseClient } from "@supabase/supabase-js";
import type { TrackingRequest } from "@/types/database";

export type OperatorShipmentScope = "all" | "mine" | "unassigned" | "participating";

export type SortDirection = "asc" | "desc";

export const OPERATOR_SHIPMENT_SORT_COLUMNS = [
  "last_sync_at",
  "created_at",
  "reference",
  "bill_of_lading",
] as const;

export type OperatorShipmentSortColumn = (typeof OPERATOR_SHIPMENT_SORT_COLUMNS)[number];

export function normalizeOperatorShipmentSortColumn(raw: string | null): OperatorShipmentSortColumn {
  if (raw && (OPERATOR_SHIPMENT_SORT_COLUMNS as readonly string[]).includes(raw)) {
    return raw as OperatorShipmentSortColumn;
  }
  return "last_sync_at";
}

export type ShipmentOverviewTrackingRow = Pick<
  TrackingRequest,
  | "id"
  | "container_id"
  | "container_number"
  | "status"
  | "last_sync_at"
  | "created_at"
  | "error_message"
  | "source_bill_of_lading"
> & { normalized_number?: string };

export type ShipmentOverviewRow = {
  id: string;
  organization_id: string;
  reference: string;
  bill_of_lading: string | null;
  shipping_line: string | null;
  shipment_group_id: string | null;
  created_at: string;
  /** Shipment owner (`shipments.created_by`). */
  owner_user_id: string | null;
  /** Primary operator (`shipments.assignee_user_id`). */
  assignee_user_id: string | null;
  tracking_requests: ShipmentOverviewTrackingRow[] | ShipmentOverviewTrackingRow | null;
};

type RpcOverviewRow = {
  total_count: number | string;
  id: string;
  organization_id: string;
  reference: string;
  bill_of_lading: string | null;
  shipping_line: string | null;
  shipment_group_id: string | null;
  created_at: string;
  owner_user_id: string | null;
  assignee_user_id: string | null;
  tracking_requests: unknown;
};

function pickTrackingRows(
  raw: ShipmentOverviewRow["tracking_requests"],
): ShipmentOverviewTrackingRow[] {
  if (raw == null) return [];
  return Array.isArray(raw) ? raw : [raw];
}

function parseTrackingRequestsJson(raw: unknown): ShipmentOverviewTrackingRow[] {
  if (raw == null) return [];
  if (!Array.isArray(raw)) return [];
  return raw as ShipmentOverviewTrackingRow[];
}

function toOverviewRow(r: RpcOverviewRow): ShipmentOverviewRow {
  return {
    id: r.id,
    organization_id: r.organization_id,
    reference: r.reference,
    bill_of_lading: r.bill_of_lading,
    shipping_line: r.shipping_line,
    shipment_group_id: r.shipment_group_id,
    created_at: r.created_at,
    owner_user_id: r.owner_user_id,
    assignee_user_id: r.assignee_user_id,
    tracking_requests: parseTrackingRequestsJson(r.tracking_requests),
  };
}

/**
 * Server-side paged shipment overview (Postgres RPC: operator_shipments_overview_page).
 */
export async function fetchOperatorShipmentsOverviewPage(
  supabase: SupabaseClient,
  args: {
    organizationId: string;
    userId: string | null;
    scope: OperatorShipmentScope;
    search: string;
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
    sortColumn,
    sortDirection,
    page,
    pageSize,
  } = args;

  const offset = Math.max(0, page) * pageSize;

  const { data, error } = await supabase.rpc("operator_shipments_overview_page", {
    p_organization_id: organizationId,
    p_user_id: userId,
    p_scope: scope,
    p_search: search.trim(),
    p_sort_column: sortColumn,
    p_sort_asc: sortDirection === "asc",
    p_limit: pageSize,
    p_offset: offset,
  });

  if (error) throw new Error(error.message);

  const rawRows = (data as RpcOverviewRow[] | null) ?? [];
  if (rawRows.length === 0) {
    return { rows: [], totalCount: 0 };
  }

  const totalCount = Number(rawRows[0]!.total_count);
  const rows = rawRows.map(toOverviewRow);

  return { rows, totalCount: Number.isFinite(totalCount) ? totalCount : 0 };
}

export function containerCount(row: ShipmentOverviewRow): number {
  return pickTrackingRows(row.tracking_requests).length;
}

export function pickTrackingRowsExported(row: ShipmentOverviewRow): ShipmentOverviewTrackingRow[] {
  return pickTrackingRows(row.tracking_requests);
}

export function maxLastSyncIso(row: ShipmentOverviewRow): string | null {
  let best: string | null = null;
  for (const tr of pickTrackingRows(row.tracking_requests)) {
    const v = tr.last_sync_at;
    if (!v) continue;
    if (!best || Date.parse(v) > Date.parse(best)) best = v;
  }
  return best;
}
