"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  normalizeOperatorSortColumn,
  type OperatorRequestScope,
  type OperatorRequestSortColumn,
  type SortDirection,
} from "@/lib/operator-tracking-requests-query";
import type { TrackingRequest } from "@/types/database";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { TablePagination } from "@/components/table-pagination";
import { TrackingWorkflowStatusPill } from "@/components/status-pills";
import { loadOperatorTrackingRequestsPageBrowser } from "@/services/shipments-lists.service";
import { fetchProfileDisplayNameMap } from "@/services/profile-display.service";

const SEARCH_INPUT_CLASS =
  "w-full max-w-md rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400/30 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500";

export type TrackingRequestsListProps = {
  /** Shown in page header (default: tracking-requests wording). */
  pageTitle?: string;
  description?: ReactNode;
  sectionHeading?: string;
  /** Operator workspace vs shipment portal detail. */
  rowDestination?: "workspace" | "shipment-portal";
};

export function TrackingRequestsList({
  pageTitle = "Tracking requests",
  description,
  sectionHeading = "All requests",
  rowDestination = "workspace",
}: TrackingRequestsListProps) {
  const router = useRouter();
  const { orgs, selectedOrgId, isSuperAdmin } = useOrganizationWorkspace();
  const [requests, setRequests] = useState<TrackingRequest[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [listFilter, setListFilter] = useState<OperatorRequestScope>("all");
  const [shipmentAssigneeLabels, setShipmentAssigneeLabels] = useState<Record<string, string>>({});
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sortColumn, setSortColumn] = useState<OperatorRequestSortColumn>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(0);
  }, [listFilter, debouncedSearch, pageSize]);

  const loadRequests = useCallback(async () => {
    if (!selectedOrgId) return;
    setLoading(true);
    setError(null);
    try {
      const { rows, totalCount: count } = await loadOperatorTrackingRequestsPageBrowser({
        organizationId: selectedOrgId,
        scope: listFilter,
        page,
        pageSize,
        sortColumn,
        sortDirection,
        search: debouncedSearch,
      });

      setRequests(rows);
      setTotalCount(count);
      const lastPage = Math.max(0, Math.ceil(count / pageSize) - 1);
      if (page > lastPage) {
        setPage(lastPage);
      }

      type TrRow = TrackingRequest & {
        containers?: {
          shipments?: { assignee_user_id?: string | null } | { assignee_user_id?: string | null }[] | null;
        } | null;
      };
      const assigneeIds = [
        ...new Set(
          rows.map((raw) => {
            const r = raw as TrRow;
            const ship = r.containers?.shipments;
            const s = Array.isArray(ship) ? ship[0] : ship;
            return s?.assignee_user_id ?? null;
          }).filter((id): id is string => Boolean(id)),
        ),
      ];
      const map = await fetchProfileDisplayNameMap(assigneeIds);
      setShipmentAssigneeLabels(map);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load requests");
      setRequests([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [selectedOrgId, listFilter, page, pageSize, sortColumn, sortDirection, debouncedSearch]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const handleSortChange = useCallback((columnId: string) => {
    const col = normalizeOperatorSortColumn(columnId);
    if (sortColumn === col) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(col);
      setSortDirection("desc");
    }
  }, [sortColumn]);

  const filterButtonClass = (active: boolean) =>
    `rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
      active
        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
    }`;

  const columns: DataTableColumn<TrackingRequest>[] = useMemo(
    () => [
      {
        id: "container_number",
        header: "Container",
        sortable: true,
        cell: (r) => <span className="font-mono font-medium">{r.container_number}</span>,
      },
      {
        id: "source_bill_of_lading",
        header: "BOL",
        cell: (r) => (
          <span className="max-w-[10rem] truncate font-mono text-xs text-zinc-600 dark:text-zinc-400" title={r.source_bill_of_lading ?? undefined}>
            {r.source_bill_of_lading?.trim() || "—"}
          </span>
        ),
      },
      {
        id: "shipment_assignee",
        header: "Shipment assignee",
        cell: (raw) => {
          const r = raw as TrackingRequest & {
            containers?: {
              shipments?: { assignee_user_id?: string | null } | { assignee_user_id?: string | null }[] | null;
            } | null;
          };
          const ship = r.containers?.shipments;
          const s = Array.isArray(ship) ? ship[0] : ship;
          const aid = s?.assignee_user_id ?? null;
          return (
            <span className="text-zinc-600 dark:text-zinc-400">
              {aid ? (shipmentAssigneeLabels[aid] ?? "—") : "—"}
            </span>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        sortable: true,
        cell: (r) => <TrackingWorkflowStatusPill status={r.status} />,
      },
      {
        id: "last_sync_at",
        header: "Last sync",
        sortable: true,
        cell: (r) => (
          <span className="text-zinc-500 tabular-nums">
            {r.last_sync_at ? new Date(r.last_sync_at).toLocaleString() : r.error_message ?? "—"}
          </span>
        ),
      },
    ],
    [shipmentAssigneeLabels],
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{pageTitle}</h1>
        {description ?? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Each row is one container line under a shipment someone in your org owns. A bill of lading can list many
            containers—we create one row per unit and group them on a shipment. Open a row for the workspace. Create new
            tracking from{" "}
            <Link href="/dashboard" className="font-medium text-zinc-900 underline dark:text-zinc-100">
              Dashboard
            </Link>
            .
          </p>
        )}
      </header>

      {orgs.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            You are not a member of any organization yet.
          </p>
          {isSuperAdmin ? (
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              As platform superadmin you still pick an org for context, or create one under{" "}
              <Link
                href="/admin/organizations"
                className="font-medium text-zinc-900 underline dark:text-zinc-100"
              >
                Platform → Organizations
              </Link>
              .
            </p>
          ) : null}
        </div>
      ) : (
        <>
          <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{sectionHeading}</h2>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Show</span>
                {(
                  [
                    ["all", "All"],
                    ["mine", "My shipments’ lines"],
                    ["unassigned", "Unassigned"],
                    ["participating", "Participating"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={filterButtonClass(listFilter === id)}
                    onClick={() => setListFilter(id)}
                  >
                    {label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => void loadRequests()}
                  className="ml-1 text-xs font-medium text-zinc-600 underline dark:text-zinc-400"
                >
                  Refresh
                </button>
              </div>
            </div>

            {selectedOrgId ? (
              <>
                <label className="sr-only" htmlFor="requests-search">
                  Search by container or reference
                </label>
                <input
                  id="requests-search"
                  type="search"
                  placeholder="Search container, BOL, or reference…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  disabled={loading}
                  className={`mb-4 ${SEARCH_INPUT_CLASS}`}
                />

                {error ? <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p> : null}

                <DataTable
                  columns={columns}
                  rows={requests}
                  getRowId={(r) => r.id}
                  loading={loading}
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSortChange={handleSortChange}
                  emptyMessage={
                    listFilter === "all"
                      ? "No tracking requests yet."
                      : "No requests match this filter."
                  }
                  onRowClick={(r) => {
                    const row = r as TrackingRequest & {
                      containers?: { shipment_id: string } | { shipment_id: string }[] | null;
                    };
                    const rel = row.containers;
                    const c = Array.isArray(rel) ? rel[0] : rel;
                    const shipmentId = c?.shipment_id;
                    if (rowDestination === "shipment-portal") {
                      router.push(shipmentId ? `/shipments/hub/${shipmentId}` : "/shipments");
                      return;
                    }
                    router.push(row.container_id ? `/containers/${row.container_id}` : "/shipments");
                  }}
                />

                <TablePagination
                  page={page}
                  pageSize={pageSize}
                  totalCount={totalCount}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                  disabled={loading}
                />
              </>
            ) : (
              <p className="py-4 text-sm text-zinc-500">Select an organization to load requests.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
