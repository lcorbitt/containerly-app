"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { OperatorShipmentsOverview } from "@/components/operator-shipments-overview";
import { CarrierReportedStatusPill, TrackingWorkflowStatusPill } from "@/components/status-pills";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { TablePagination } from "@/components/table-pagination";
import {
  normalizeImporterGrantedShipmentSortColumn,
  type ImporterGrantedShipmentRow,
  type ImporterGrantedShipmentSortColumn,
  type NestedContainer,
  type SortDirection,
} from "@/lib/importer-shipments-query";
import { formatTimestamp } from "@/utils/datetime";
import { shipperReceiverFromLocation } from "@/lib/jsoncargo-display";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { loadImporterGrantedShipmentsPageBrowser } from "@/services/shipments-lists.service";

function pickSingle<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

function lastDataUpdateIso(row: ImporterGrantedShipmentRow): string | null {
  const c = pickSingle<NestedContainer>(row.containers ?? null);
  const sync = c?.last_synced_at ?? row.last_sync_at ?? null;
  const u = row.updated_at;
  if (sync && u) {
    return Date.parse(sync) >= Date.parse(u) ? sync : u;
  }
  return sync ?? u ?? null;
}

function destinationLabel(cont: NestedContainer | null): string {
  if (!cont?.location || typeof cont.location !== "object") return "—";
  const loc = cont.location;
  const { receiver } = shipperReceiverFromLocation(loc);
  if (receiver?.trim()) return receiver.trim();
  const disc = loc.discharging_port;
  if (typeof disc === "string" && disc.trim()) return disc.trim();
  const next = loc.next_location;
  if (typeof next === "string" && next.trim()) return next.trim();
  return "—";
}

const SEARCH_INPUT_CLASS =
  "w-full max-w-md rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400/30 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500";

function useFreightOperator() {
  const { orgs, isSuperAdmin } = useOrganizationWorkspace();
  return (
    isSuperAdmin || orgs.some((r) => r.organizations != null && r.organizations.id != null)
  );
}

function OperatorShipmentsList() {
  return <OperatorShipmentsOverview pageTitle="Shipments" />;
}

function ImporterGrantedShipmentsList() {
  const router = useRouter();
  const [rows, setRows] = useState<ImporterGrantedShipmentRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sortColumn, setSortColumn] = useState<ImporterGrantedShipmentSortColumn>("reference");
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
            <span className="max-w-[14rem] truncate text-zinc-800 dark:text-zinc-200" title={dest}>
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
            <div className="min-w-[8rem]">
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

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Shipments shared with me</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Shipments your logistics partners invited you to follow—one row per commercial shipment (all units
        visible inside).
      </p>

      {error ? <p className="mt-6 text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <label className="sr-only" htmlFor="shipments-search">
          Search by container or reference
        </label>
        <input
          id="shipments-search"
          type="search"
          placeholder="Search container, BOL, or reference…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          disabled={loading}
          className={`mb-4 ${SEARCH_INPUT_CLASS}`}
        />

        <DataTable
          columns={columns}
          rows={rows}
          getRowId={(r) => r.id}
          loading={loading}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
          emptyMessage="Nothing shared with you yet. When a partner sends an invite link, open it and sign in to accept access."
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
    </div>
  );
}

export default function ShipmentsPage() {
  const freight = useFreightOperator();
  if (freight) {
    return <OperatorShipmentsList />;
  }
  return <ImporterGrantedShipmentsList />;
}
