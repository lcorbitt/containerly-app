export type SortDirection = "asc" | "desc";

/**
 * Single source of truth for operator shipments table sorting.
 * Each value is both the UI column id and `p_sort_column` for `operator_shipments_overview_page`.
 */
export const OPERATOR_SHIPMENT_SORT_COLUMNS = [
  "last_sync_at",
  "created_at",
  "order_number",
  "bill_of_lading",
  "customer_name",
  "consignee",
  "container_number",
  "port_of_loading",
  "port_of_destination",
  "assignee",
  "workflow_status",
  "estimated_departure_at",
  "estimated_arrival_at",
  "tags",
] as const;

export type OperatorShipmentSortColumn = (typeof OPERATOR_SHIPMENT_SORT_COLUMNS)[number];

export type OperatorShipmentScope = "all" | "mine" | "unassigned" | "participating";

export const DEFAULT_OPERATOR_SHIPMENT_SORT_COLUMN: OperatorShipmentSortColumn = "last_sync_at";

const DESCENDING_BY_DEFAULT: ReadonlySet<OperatorShipmentSortColumn> = new Set([
  "last_sync_at",
  "created_at",
]);

const ASCENDING_BY_DEFAULT: ReadonlySet<OperatorShipmentSortColumn> = new Set([
  "tags",
  "customer_name",
  "consignee",
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

export function defaultSortDirectionForOperatorShipmentColumn(
  column: OperatorShipmentSortColumn,
): SortDirection {
  if (DESCENDING_BY_DEFAULT.has(column)) return "desc";
  if (ASCENDING_BY_DEFAULT.has(column)) return "asc";
  return "asc";
}
