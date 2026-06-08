"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DataTableColumn, DataTableExportConfig } from "@/components/DataTable";
import { ShipmentWorkflowStatusPill } from "@/components/StatusPills";
import { SHIPMENT_OVERVIEW_DATE_CELL_CLASS } from "@/app/(authenticated)/shipments/components/OperatorShipmentsOverview/ShipmentOverviewDateFilters/constants";
import { displayOverviewText, formatOverviewDate } from "@/utils/shipment-overview-display";
import { shipmentWorkflowDisplayLabel } from "@/utils/shipment-workflow-status";
import { fetchAllImporterGrantedShipmentRows } from "@/utils/shipment-list-export";
import {
  loadImporterGrantedShipmentsPageBrowser,
  normalizeImporterGrantedShipmentSortColumn,
  type ImporterGrantedShipmentRow,
  type ImporterGrantedShipmentSortColumn,
  type SortDirection,
} from "@/services/shipment.service";
import {
  DEFAULT_IMPORTER_GRANTED_SHIPMENT_SORT_COLUMN,
  defaultSortDirectionForImporterGrantedShipmentColumn,
} from "@/utils/importer-shipment-sort";

export function useImporterShipmentsList() {
  const router = useRouter();
  const [rows, setRows] = useState<ImporterGrantedShipmentRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sortColumn, setSortColumn] = useState<ImporterGrantedShipmentSortColumn>(
    DEFAULT_IMPORTER_GRANTED_SHIPMENT_SORT_COLUMN,
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, pageSize]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { rows: data, totalCount: count } = await loadImporterGrantedShipmentsPageBrowser({
        page,
        pageSize,
        sortColumn,
        sortDirection,
        search: debouncedSearch,
      });
      setRows(data);
      setTotalCount(count);
      const lastPage = Math.max(0, Math.ceil(count / pageSize) - 1);
      if (page > lastPage) {
        setPage(lastPage);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load shipments");
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortColumn, sortDirection, debouncedSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  const fetchExportRows = useCallback(async () => {
    if (totalCount === 0) return [];

    return fetchAllImporterGrantedShipmentRows({
      sortColumn,
      sortDirection,
      search: debouncedSearch,
    });
  }, [totalCount, sortColumn, sortDirection, debouncedSearch]);

  const tableExport = useMemo<DataTableExportConfig<ImporterGrantedShipmentRow>>(
    () => ({
      fileName: `my-shipments-${new Date().toISOString().slice(0, 10)}`,
      fetchRows: fetchExportRows,
    }),
    [fetchExportRows],
  );

  const handleSortChange = useCallback(
    (columnId: string) => {
      const col = normalizeImporterGrantedShipmentSortColumn(columnId);
      if (sortColumn === col) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortColumn(col);
        setSortDirection(defaultSortDirectionForImporterGrantedShipmentColumn(col));
      }
    },
    [sortColumn],
  );

  const columns: DataTableColumn<ImporterGrantedShipmentRow>[] = useMemo(
    () => [
      {
        id: "organization_name",
        header: "Organization",
        sortable: true,
        exportValue: (r) => displayOverviewText(r.organization_name),
        cell: (r) => (
          <span
            className="max-w-[10rem] truncate text-sm font-medium text-zinc-800 dark:text-zinc-200"
            title={r.organization_name}
          >
            {displayOverviewText(r.organization_name)}
          </span>
        ),
      },
      {
        id: "customer_name",
        header: "Customer",
        sortable: true,
        exportValue: (r) => displayOverviewText(r.customer_name),
        cell: (r) => (
          <span
            className="max-w-[10rem] truncate text-sm text-zinc-800 dark:text-zinc-200"
            title={r.customer_name ?? undefined}
          >
            {displayOverviewText(r.customer_name)}
          </span>
        ),
      },
      {
        id: "consignee",
        header: "Consignee",
        sortable: true,
        exportValue: (r) => displayOverviewText(r.consignee),
        cell: (r) => (
          <span
            className="max-w-[10rem] truncate text-sm text-zinc-800 dark:text-zinc-200"
            title={r.consignee ?? undefined}
          >
            {displayOverviewText(r.consignee)}
          </span>
        ),
      },
      {
        id: "order_number",
        header: "Order no.",
        sortable: true,
        exportHeader: "Order No.",
        exportValue: (r) => r.order_number,
        className: "min-w-[6.5rem] w-[7rem] whitespace-nowrap",
        headerClassName: "whitespace-nowrap",
        cell: (r) => (
          <span className="font-medium text-zinc-900 dark:text-zinc-50">{r.order_number}</span>
        ),
      },
      {
        id: "port_of_loading",
        header: "Origin",
        sortable: true,
        exportValue: (r) => displayOverviewText(r.port_of_loading),
        cell: (r) => (
          <span
            className="max-w-[9rem] truncate text-sm font-medium text-zinc-800 dark:text-zinc-200"
            title={r.port_of_loading ?? undefined}
          >
            {displayOverviewText(r.port_of_loading)}
          </span>
        ),
      },
      {
        id: "port_of_destination",
        header: "Destination",
        sortable: true,
        exportValue: (r) => displayOverviewText(r.port_of_destination),
        cell: (r) => (
          <span
            className="max-w-[9rem] truncate text-sm font-medium text-zinc-800 dark:text-zinc-200"
            title={r.port_of_destination ?? undefined}
          >
            {displayOverviewText(r.port_of_destination)}
          </span>
        ),
      },
      {
        id: "workflow_status",
        header: "Documents",
        sortable: true,
        exportValue: (r) => shipmentWorkflowDisplayLabel(r.workflow_status),
        className: "min-w-[7.75rem] max-w-[9.5rem]",
        headerClassName: "whitespace-nowrap",
        cell: (r) =>
          r.workflow_status ? (
            <ShipmentWorkflowStatusPill status={r.workflow_status} compact />
          ) : (
            <span className="text-xs text-zinc-500">—</span>
          ),
      },
      {
        id: "estimated_departure_at",
        header: "ETD",
        sortable: true,
        exportValue: (r) => formatOverviewDate(r.estimated_departure_at),
        headerClassName: "whitespace-nowrap",
        cell: (r) => (
          <span className={SHIPMENT_OVERVIEW_DATE_CELL_CLASS}>
            {formatOverviewDate(r.estimated_departure_at)}
          </span>
        ),
      },
      {
        id: "estimated_arrival_at",
        header: "ETA",
        sortable: true,
        exportHeader: "ETA",
        exportValue: (r) => formatOverviewDate(r.estimated_arrival_at),
        headerClassName: "whitespace-nowrap",
        cell: (r) => (
          <span className={SHIPMENT_OVERVIEW_DATE_CELL_CLASS}>
            {formatOverviewDate(r.estimated_arrival_at)}
          </span>
        ),
      },
    ],
    [],
  );

  const navigateToShipment = useCallback(
    (r: ImporterGrantedShipmentRow) => router.push(`/shipments/hub/${r.id}`),
    [router],
  );

  return {
    rows,
    totalCount,
    page,
    setPage,
    pageSize,
    setPageSize,
    sortColumn,
    sortDirection,
    searchInput,
    setSearchInput,
    loading,
    error,
    handleSortChange,
    columns,
    navigateToShipment,
    tableExport,
  };
}
