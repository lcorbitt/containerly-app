import type { SupabaseClient } from "@supabase/supabase-js";

export type SortDirection = "asc" | "desc";

export const IMPORTER_GRANTED_SHIPMENT_SORT_COLUMNS = [
  "reference",
  "created_at",
  "updated_at",
] as const;

export type ImporterGrantedShipmentSortColumn =
  (typeof IMPORTER_GRANTED_SHIPMENT_SORT_COLUMNS)[number];

export function normalizeImporterGrantedShipmentSortColumn(
  raw: string | null,
): ImporterGrantedShipmentSortColumn {
  if (raw && (IMPORTER_GRANTED_SHIPMENT_SORT_COLUMNS as readonly string[]).includes(raw)) {
    return raw as ImporterGrantedShipmentSortColumn;
  }
  return "created_at";
}

function sanitizeIlikeTerm(term: string): string {
  return term.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export type NestedContainer = {
  id?: string;
  container_number?: string | null;
  status: string | null;
  last_synced_at: string | null;
  location: Record<string, unknown> | null;
  tracking_requests?:
    | { status: string | null; last_sync_at: string | null }
    | { status: string | null; last_sync_at: string | null }[]
    | null;
};

/** One grant row: shipment-scoped importer access. */
export type ImporterGrantedShipmentRow = {
  /** Shipment id — use for `/shipments/hub/[id]` (shared tracking) and `get-shipment`. */
  id: string;
  access_grant_id: string;
  reference: string;
  container_number: string;
  status: string;
  last_sync_at: string | null;
  updated_at: string;
  created_at: string;
  containers: NestedContainer | NestedContainer[] | null;
};

type AccessShipmentRow = {
  id: string;
  created_at: string;
  updated_at: string;
  shipment_id: string;
  shipments:
    | {
        id: string;
        reference: string;
        bill_of_lading: string | null;
        shipping_line: string | null;
        updated_at: string;
        containers?: NestedContainer | NestedContainer[] | null;
      }
    | {
        id: string;
        reference: string;
        bill_of_lading: string | null;
        shipping_line: string | null;
        updated_at: string;
        containers?: NestedContainer | NestedContainer[] | null;
      }[]
    | null;
};

function pickTrStatus(c: NestedContainer | null | undefined): string | null {
  if (!c?.tracking_requests) return null;
  const tr = Array.isArray(c.tracking_requests) ? c.tracking_requests[0] : c.tracking_requests;
  return (tr?.status as string | null) ?? null;
}

/**
 * Paged list of shipments granted to the signed-in importer (`shipment_customer_access`).
 */
export async function fetchImporterGrantedShipmentsPage(
  supabase: SupabaseClient,
  args: {
    userId: string;
    page: number;
    pageSize: number;
    sortColumn: ImporterGrantedShipmentSortColumn;
    sortDirection: SortDirection;
    search: string;
  },
): Promise<{ rows: ImporterGrantedShipmentRow[]; totalCount: number }> {
  const { userId, page, pageSize, sortColumn, sortDirection, search } = args;

  let q = supabase
    .from("shipment_customer_access")
    .select(
      `
      id,
      created_at,
      updated_at,
      shipment_id,
      shipments!inner (
        id,
        reference,
        bill_of_lading,
        shipping_line,
        updated_at,
        containers (
          id,
          container_number,
          status,
          last_synced_at,
          location,
          tracking_requests ( status, last_sync_at )
        )
      )
    `,
      { count: "exact" },
    )
    .eq("customer_user_id", userId)
    .is("revoked_at", null);

  const term = search.trim();
  if (term) {
    const s = sanitizeIlikeTerm(term);
    q = q.or(`reference.ilike.%${s}%,bill_of_lading.ilike.%${s}%`, {
      referencedTable: "shipments",
    });
  }

  const sortRef =
    sortColumn === "reference"
      ? { column: "reference" as const, foreignTable: "shipments" as const }
      : sortColumn === "updated_at"
        ? { column: "updated_at" as const, foreignTable: "shipments" as const }
        : { column: "created_at" as const, foreignTable: undefined };

  if (sortRef.foreignTable) {
    q = q.order(sortRef.column, {
      ascending: sortDirection === "asc",
      referencedTable: sortRef.foreignTable,
    });
  } else {
    q = q.order(sortRef.column, { ascending: sortDirection === "asc" });
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await q.range(from, to);
  if (error) throw new Error(error.message);

  const raw = (data ?? []) as AccessShipmentRow[];
  const rows: ImporterGrantedShipmentRow[] = [];
  for (const row of raw) {
    const ship = row.shipments;
    const s = Array.isArray(ship) ? ship[0] : ship;
    if (!s?.id) continue;
    const contRaw = s.containers;
    const contList: NestedContainer[] = !contRaw
      ? []
      : Array.isArray(contRaw)
        ? contRaw
        : [contRaw];
    contList.sort((a, b) =>
      String(a.container_number ?? "").localeCompare(String(b.container_number ?? "")),
    );
    const first = contList[0] ?? null;
    const numbers = contList
      .map((c) => c.container_number?.trim())
      .filter(Boolean) as string[];
    const label =
      numbers.length === 0
        ? s.reference.trim() || s.id.slice(0, 8)
        : numbers.length === 1
          ? numbers[0]!
          : `${numbers.length} containers`;
    const trStatus = pickTrStatus(first);
    const syncAt =
      first?.last_synced_at ??
      (Array.isArray(first?.tracking_requests)
        ? first?.tracking_requests[0]?.last_sync_at
        : first?.tracking_requests?.last_sync_at) ??
      null;

    rows.push({
      id: s.id,
      access_grant_id: row.id,
      reference: s.reference,
      container_number: label,
      status: trStatus ?? "pending",
      last_sync_at: syncAt,
      updated_at: s.updated_at ?? row.updated_at,
      created_at: row.created_at,
      containers: first,
    });
  }

  return { rows, totalCount: count ?? 0 };
}
