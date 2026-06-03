"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CarrierReportedStatusPill, TrackingWorkflowStatusPill } from "@/components/StatusPills";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { Reveal } from "@/components/Reveal";
import { TablePagination } from "@/components/TablePagination";
import { TextInput } from "@/components/TextInput";
import {
  loadImporterGrantedShipmentsPageBrowser,
  normalizeImporterGrantedShipmentSortColumn,
  type ImporterGrantedShipmentRow,
  type ImporterGrantedShipmentSortColumn,
  type NestedContainer,
  type SortDirection,
} from "@/services/shipment.service";
import { formatTimestamp } from "@/utils/datetime";
import {
  IMPORTER_SHIPMENTS_EMPTY_MESSAGE,
  IMPORTER_SHIPMENTS_PANEL_CLASS,
  IMPORTER_SHIPMENTS_SUBTITLE,
  IMPORTER_SHIPMENTS_TITLE,
  SEARCH_INPUT_CLASS,
} from "./constants";
import { destinationLabel, lastDataUpdateIso, pickSingle } from "./utils";

export function ImporterShipmentsList() {
  const router = useRouter();
  const [rows, setRows] = useState<ImporterGrantedShipmentRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sortColumn, setSortColumn] = useState<ImporterGrantedShipmentSortColumn>("order_number");
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

  const handleSortChange = useCallback((columnId: string) => {
    const col = normalizeImporterGrantedShipmentSortColumn(columnId);
    if (sortColumn === col) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(col);
      setSortDirection("desc");
    }
  }, [sortColumn]);

  const columns: DataTableColumn<ImporterGrantedShipmentRow>[] = useMemo(
    () => [
      {
        id: "container_number",
        header: "Container",
        sortable: true,
        cell: (r) => (
          <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-50">
            {r.container_number?.trim() || r.id.slice(0, 8)}
          </span>
        ),
      },
      {
        id: "destination",
        header: "Destination",
        cell: (r) => {
          const cont = pickSingle<NestedContainer>(r.containers ?? null);
          const dest = destinationLabel(cont);
          return (
            <span className="max-w-56 truncate text-zinc-800 dark:text-zinc-200" title={dest}>
              {dest}
            </span>
          );
        },
      },
      {
        id: "status",
        header: "Tracking",
        sortable: false,
        cell: (r) =>
          r.status ? <TrackingWorkflowStatusPill status={r.status} /> : <span className="text-zinc-500">—</span>,
      },
      {
        id: "carrier_status",
        header: "Carrier status",
        cell: (r) => {
          const cont = pickSingle<NestedContainer>(r.containers ?? null);
          return (
            <div className="min-w-32">
              <CarrierReportedStatusPill status={cont?.status ?? null} />
            </div>
          );
        },
      },
      {
        id: "updated_at",
        header: "Last update",
        sortable: true,
        cell: (r) => {
          const lastUp = lastDataUpdateIso(r);
          return (
            <span className="whitespace-nowrap text-zinc-600 tabular-nums dark:text-zinc-400">
              {lastUp ? formatTimestamp(lastUp) : "—"}
            </span>
          );
        },
      },
    ],
    [],
  );

  const showPanel = true;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{IMPORTER_SHIPMENTS_TITLE}</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{IMPORTER_SHIPMENTS_SUBTITLE}</p>

      {error ? <p className="mt-6 text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      <Reveal show={showPanel}>
        <section className={IMPORTER_SHIPMENTS_PANEL_CLASS}>
          <label className="sr-only" htmlFor="shipments-search">
            Search by container or order no.
          </label>
          <TextInput
            id="shipments-search"
            type="search"
            placeholder="Search container, BOL, or order no.…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            disabled={loading}
            containerClassName="mb-4 max-w-md"
            className={SEARCH_INPUT_CLASS}
          />

          <DataTable
            columns={columns}
            rows={rows}
            getRowId={(r) => r.id}
            loading={loading}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
            emptyMessage={IMPORTER_SHIPMENTS_EMPTY_MESSAGE}
            onRowClick={(r) => router.push(`/shipments/hub/${r.id}`)}
          />

          <TablePagination
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            disabled={loading}
          />
        </section>
      </Reveal>
    </div>
  );
}
