export type SortDirection = "asc" | "desc";

/**
 * Sort columns for the customer "Shipments shared with me" table.
 * Keep in sync with `importer_granted_shipments_overview_page` Postgres RPC.
 */
export const IMPORTER_GRANTED_SHIPMENT_SORT_COLUMNS = [
  "last_sync_at",
  "created_at",
  "order_number",
  "customer_name",
  "consignee",
  "organization_name",
  "port_of_loading",
  "port_of_destination",
  "workflow_status",
  "estimated_departure_at",
  "estimated_arrival_at",
] as const;

export type ImporterGrantedShipmentSortColumn =
  (typeof IMPORTER_GRANTED_SHIPMENT_SORT_COLUMNS)[number];

export const DEFAULT_IMPORTER_GRANTED_SHIPMENT_SORT_COLUMN: ImporterGrantedShipmentSortColumn =
  "last_sync_at";

const DESCENDING_BY_DEFAULT: ReadonlySet<ImporterGrantedShipmentSortColumn> = new Set([
  "last_sync_at",
  "created_at",
]);

const ASCENDING_BY_DEFAULT: ReadonlySet<ImporterGrantedShipmentSortColumn> = new Set([
  "customer_name",
  "consignee",
  "order_number",
  "organization_name",
  "port_of_loading",
  "port_of_destination",
  "workflow_status",
  "estimated_departure_at",
  "estimated_arrival_at",
]);

export function normalizeImporterGrantedShipmentSortColumn(
  raw: string | null,
): ImporterGrantedShipmentSortColumn {
  if (raw && (IMPORTER_GRANTED_SHIPMENT_SORT_COLUMNS as readonly string[]).includes(raw)) {
    return raw as ImporterGrantedShipmentSortColumn;
  }
  return DEFAULT_IMPORTER_GRANTED_SHIPMENT_SORT_COLUMN;
}

export function defaultSortDirectionForImporterGrantedShipmentColumn(
  column: ImporterGrantedShipmentSortColumn,
): SortDirection {
  if (DESCENDING_BY_DEFAULT.has(column)) return "desc";
  if (ASCENDING_BY_DEFAULT.has(column)) return "asc";
  return "asc";
}
