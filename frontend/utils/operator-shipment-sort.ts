import type { SortDirection } from "@/components/DataTable";

/**
 * Single source of truth for operator shipments table sorting.
 *
 * Each value is both the `DataTableColumn.id` used by the table header and the
 * `p_sort_column` understood by the `operator_shipments_overview_page` Postgres
 * RPC. Keep this list in sync with that function's `v_sort` whitelist.
 *
 * Imported by the browser service (`shipment.service.ts`) and the server-only
 * service (`shipment.server.ts`) so the whitelist is defined once.
 */
export const OPERATOR_SHIPMENT_SORT_COLUMNS = [
  "last_sync_at",
  "created_at",
  "order_number",
  "bill_of_lading",
  "customer_name",
  "container_number",
  "port_of_loading",
  "port_of_destination",
  "assignee",
  "workflow_status",
  "estimated_arrival_at",
  "tags",
] as const;

export type OperatorShipmentSortColumn = (typeof OPERATOR_SHIPMENT_SORT_COLUMNS)[number];

export const DEFAULT_OPERATOR_SHIPMENT_SORT_COLUMN: OperatorShipmentSortColumn = "last_sync_at";

/** Columns whose natural reading is newest-first (descending) by default. */
const DESCENDING_BY_DEFAULT: ReadonlySet<OperatorShipmentSortColumn> = new Set([
  "last_sync_at",
  "created_at",
]);

/** Columns that default to A→Z when first selected. */
const ASCENDING_BY_DEFAULT: ReadonlySet<OperatorShipmentSortColumn> = new Set([
  "tags",
  "customer_name",
  "order_number",
  "port_of_loading",
  "port_of_destination",
  "assignee",
  "workflow_status",
]);

export function normalizeOperatorShipmentSortColumn(raw: string | null): OperatorShipmentSortColumn {
  if (raw && (OPERATOR_SHIPMENT_SORT_COLUMNS as readonly string[]).includes(raw)) {
    return raw as OperatorShipmentSortColumn;
  }
  return DEFAULT_OPERATOR_SHIPMENT_SORT_COLUMN;
}

/** Default direction applied when a user first sorts by a column. */
export function defaultSortDirectionForOperatorShipmentColumn(
  column: OperatorShipmentSortColumn,
): SortDirection {
  if (DESCENDING_BY_DEFAULT.has(column)) return "desc";
  if (ASCENDING_BY_DEFAULT.has(column)) return "asc";
  return "asc";
}
