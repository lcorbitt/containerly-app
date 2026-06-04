"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DataTableColumn } from "@/components/DataTable";
import { ShipmentWorkflowStatusPill } from "@/components/StatusPills";
import { displayOverviewText, formatOverviewDate } from "@/utils/shipment-overview-display";
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
        id: "order_number",
        header: "Order no.",
        sortable: true,
        cell: (r) => (
          <span className="font-medium text-zinc-900 dark:text-zinc-50">{r.order_number}</span>
        ),
      },
      {
        id: "port_of_loading",
        header: "Origin",
        sortable: true,
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
        id: "estimated_arrival_at",
        header: "Est. arrival",
        sortable: true,
        cell: (r) => (
          <span className="whitespace-nowrap text-xs tabular-nums text-zinc-700 dark:text-zinc-300">
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
  };
}
