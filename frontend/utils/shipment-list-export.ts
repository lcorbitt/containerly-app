import type { OperatorShipmentDateRangeFilter } from "@/utils/operator-shipment-date-filters";
import {
  loadImporterGrantedShipmentsPageBrowser,
  loadOperatorShipmentsOverviewPageBrowser,
  type ImporterGrantedShipmentRow,
  type ImporterGrantedShipmentSortColumn,
  type OperatorShipmentScope,
  type OperatorShipmentSortColumn,
  type ShipmentOverviewRow,
  type SortDirection,
} from "@/services/shipment.service";

const EXPORT_PAGE_SIZE = 100;

export async function fetchAllOperatorShipmentsOverviewRows(args: {
  organizationId: string;
  scope: OperatorShipmentScope;
  search: string;
  tagFilter?: string | null;
  dateRangeFilter?: OperatorShipmentDateRangeFilter;
  sortColumn: OperatorShipmentSortColumn;
  sortDirection: SortDirection;
}): Promise<ShipmentOverviewRow[]> {
  const first = await loadOperatorShipmentsOverviewPageBrowser({
    ...args,
    page: 0,
    pageSize: EXPORT_PAGE_SIZE,
  });

  const rows = [...first.rows];
  for (let page = 1; page * EXPORT_PAGE_SIZE < first.totalCount; page += 1) {
    const next = await loadOperatorShipmentsOverviewPageBrowser({
      ...args,
      page,
      pageSize: EXPORT_PAGE_SIZE,
    });
    rows.push(...next.rows);
  }

  return rows;
}

export async function fetchAllImporterGrantedShipmentRows(args: {
  sortColumn: ImporterGrantedShipmentSortColumn;
  sortDirection: SortDirection;
  search: string;
  dateRangeFilter?: OperatorShipmentDateRangeFilter;
}): Promise<ImporterGrantedShipmentRow[]> {
  const first = await loadImporterGrantedShipmentsPageBrowser({
    ...args,
    page: 0,
    pageSize: EXPORT_PAGE_SIZE,
  });

  const rows = [...first.rows];
  for (let page = 1; page * EXPORT_PAGE_SIZE < first.totalCount; page += 1) {
    const next = await loadImporterGrantedShipmentsPageBrowser({
      ...args,
      page,
      pageSize: EXPORT_PAGE_SIZE,
    });
    rows.push(...next.rows);
  }

  return rows;
}
