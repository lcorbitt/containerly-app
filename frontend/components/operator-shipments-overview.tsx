"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Ship } from "lucide-react";
import { BolImportDialog } from "@/components/bol-import-dialog";
import { createClient } from "@/lib/supabase/client";
import { formatTimestamp } from "@/utils/datetime";
import {
  containerCount,
  fetchOperatorShipmentsOverviewPage,
  maxLastSyncIso,
  normalizeOperatorShipmentSortColumn,
  pickTrackingRowsExported,
  type OperatorShipmentScope,
  type OperatorShipmentSortColumn,
  type ShipmentOverviewRow,
  type ShipmentOverviewTrackingRow,
} from "@/lib/operator-shipments-overview-query";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { TRACKING_CREATED_EVENT } from "@/lib/tracking-created-event";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { TablePagination } from "@/components/table-pagination";
import { TrackingWorkflowStatusPill } from "@/components/status-pills";
import { profileDisplayName } from "@/lib/author-display-name";

const SEARCH_INPUT_CLASS =
  "w-full max-w-md rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400/30 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500";

function aggregateStatusLabel(trs: ShipmentOverviewTrackingRow[]): string {
  if (trs.length === 0) return "—";
  const set = new Set(trs.map((t) => t.status));
  if (set.has("failed")) return "Needs attention";
  if (set.has("syncing") || set.has("pending")) return "Syncing";
  if (set.size === 1) return trs[0]!.status;
  return "Mixed";
}

function worstStatusForPill(
  trs: ShipmentOverviewTrackingRow[],
): ShipmentOverviewTrackingRow["status"] | null {
  if (trs.length === 0) return null;
  const order = ["failed", "syncing", "pending", "active", "completed"] as const;
  for (const s of order) {
    if (trs.some((t) => t.status === s)) return s;
  }
  return trs[0]!.status;
}

export function OperatorShipmentsOverview({
  pageTitle = "Shipments",
  description,
}: {
  pageTitle?: string;
  description?: ReactNode;
}) {
  const router = useRouter();
  const { orgs, selectedOrgId, isSuperAdmin } = useOrganizationWorkspace();
  const [rows, setRows] = useState<ShipmentOverviewRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listFilter, setListFilter] = useState<OperatorShipmentScope>("all");
  const [peopleLabels, setPeopleLabels] = useState<Record<string, string>>({});
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sortColumn, setSortColumn] = useState<OperatorShipmentSortColumn>("last_sync_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [bolImportOpen, setBolImportOpen] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(0);
    }, 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(0);
  }, [listFilter, pageSize, sortColumn, sortDirection]);

  const load = useCallback(async () => {
    if (!selectedOrgId) return;
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id ?? null;

      const { rows: data, totalCount: count } = await fetchOperatorShipmentsOverviewPage(supabase, {
        organizationId: selectedOrgId,
        userId: uid,
        scope: listFilter,
        search: debouncedSearch,
        sortColumn,
        sortDirection,
        page,
        pageSize,
      });

      setRows(data);
      setTotalCount(count);

      const assigneeIds = [
        ...new Set(data.map((r) => r.assignee_user_id).filter((id): id is string => Boolean(id))),
      ];
      const ownerIds = [
        ...new Set(data.map((r) => r.owner_user_id).filter((id): id is string => Boolean(id))),
      ];
      const peopleIds = [...new Set([...assigneeIds, ...ownerIds])];
      if (peopleIds.length === 0) {
        setPeopleLabels({});
      } else {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, email, full_name")
          .in("id", peopleIds);
        const map: Record<string, string> = {};
        for (const p of profs ?? []) {
          map[p.id as string] = profileDisplayName({
            full_name: p.full_name as string | null,
            email: p.email as string | null,
          });
        }
        setPeopleLabels(map);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load shipments");
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [selectedOrgId, listFilter, debouncedSearch, sortColumn, sortDirection, page, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onCreated = () => {
      void load();
    };
    window.addEventListener(TRACKING_CREATED_EVENT, onCreated);
    return () => window.removeEventListener(TRACKING_CREATED_EVENT, onCreated);
  }, [load]);

  useEffect(() => {
    const lastPage = Math.max(0, Math.ceil(totalCount / pageSize) - 1);
    if (page > lastPage) {
      setPage(lastPage);
    }
  }, [totalCount, pageSize, page]);

  const handleSortChange = useCallback(
    (columnId: string) => {
      const col = normalizeOperatorShipmentSortColumn(columnId);
      if (sortColumn === col) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortColumn(col);
        setSortDirection(col === "reference" || col === "bill_of_lading" ? "asc" : "desc");
      }
    },
    [sortColumn],
  );

  const filterButtonClass = (active: boolean) =>
    `rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
      active
        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
    }`;

  const columns: DataTableColumn<ShipmentOverviewRow>[] = useMemo(
    () => [
      {
        id: "reference",
        header: "Shipment",
        sortable: true,
        cell: (r) => {
          const n = containerCount(r);
          return (
            <div className="min-w-0">
              <span className="font-medium text-zinc-900 dark:text-zinc-50">{r.reference}</span>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {n === 1 ? "1 container" : `${n} containers`}
              </p>
            </div>
          );
        },
      },
      {
        id: "owner_user_id",
        header: "Owner",
        cell: (r) => (
          <span className="text-xs text-zinc-600 dark:text-zinc-400">
            {r.owner_user_id ? (peopleLabels[r.owner_user_id] ?? "—") : "—"}
          </span>
        ),
      },
      {
        id: "bill_of_lading",
        header: "Bill of lading",
        sortable: true,
        cell: (r) => (
          <span
            className="max-w-[12rem] truncate font-mono text-xs text-zinc-600 dark:text-zinc-400"
            title={r.bill_of_lading ?? undefined}
          >
            {r.bill_of_lading?.trim() || "—"}
          </span>
        ),
      },
      {
        id: "shipping_line",
        header: "Carrier (API)",
        cell: (r) => (
          <span className="text-xs text-zinc-600 dark:text-zinc-400">
            {r.shipping_line?.trim() || "—"}
          </span>
        ),
      },
      {
        id: "containers",
        header: "Container numbers",
        cell: (r) => {
          const trs = pickTrackingRowsExported(r);
          const preview = trs
            .slice(0, 3)
            .map((t) => t.container_number)
            .join(", ");
          const more = trs.length > 3 ? ` +${trs.length - 3}` : "";
          return (
            <span className="font-mono text-xs text-zinc-800 dark:text-zinc-200" title={trs.map((t) => t.container_number).join(", ")}>
              {preview || "—"}
              {more}
            </span>
          );
        },
      },
      {
        id: "assignee",
        header: "Assignee",
        cell: (r) => {
          const label = r.assignee_user_id ? peopleLabels[r.assignee_user_id] : null;
          if (!label) return <span className="text-zinc-500">—</span>;
          return (
            <span className="max-w-[10rem] truncate text-xs text-zinc-600 dark:text-zinc-400" title={label}>
              {label}
            </span>
          );
        },
      },
      {
        id: "status",
        header: "Tracking status",
        cell: (r) => {
          const trs = pickTrackingRowsExported(r);
          const pillStatus = worstStatusForPill(trs);
          return (
            <div className="flex flex-col gap-0.5">
              {pillStatus ? <TrackingWorkflowStatusPill status={pillStatus} /> : null}
              <span className="text-[10px] text-zinc-500">{aggregateStatusLabel(trs)}</span>
            </div>
          );
        },
      },
      {
        id: "last_sync_at",
        header: "Last activity",
        sortable: true,
        cell: (r) => {
          const iso = maxLastSyncIso(r);
          return (
            <span className="whitespace-nowrap text-xs tabular-nums text-zinc-600 dark:text-zinc-400">
              {iso ? formatTimestamp(iso) : "—"}
            </span>
          );
        },
      },
      {
        id: "created_at",
        header: "Created",
        sortable: true,
        cell: (r) => (
          <span className="whitespace-nowrap text-xs tabular-nums text-zinc-600 dark:text-zinc-400">
            {r.created_at ? formatTimestamp(r.created_at) : "—"}
          </span>
        ),
      },
    ],
    [peopleLabels],
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{pageTitle}</h1>
        {description ?? (
          <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <p>
              Each row is one <strong className="font-medium text-zinc-800 dark:text-zinc-200">shipment</strong> you or
              a teammate owns (<strong className="font-medium text-zinc-800 dark:text-zinc-200">Owner</strong> column).
              Under it, every{" "}
              <strong className="font-medium text-zinc-800 dark:text-zinc-200">container line</strong> is synced like
              JSONCargo’s{" "}
              <a
                href="https://jsoncargo.com/documentation-api/"
                className="font-medium text-zinc-900 underline dark:text-zinc-100"
                target="_blank"
                rel="noreferrer"
              >
                container details API
              </a>{" "}
              (one tracked unit per container number). A bill of lading can list many containers; we group those lines
              on the same shipment when you import from BOL.
            </p>
            <p>
              Open a shipment for an overview of all containers, then jump into a{" "}
              <Link href="/dashboard" className="font-medium text-zinc-900 underline dark:text-zinc-100">
                container workspace
              </Link>{" "}
              for collaboration, invites, and attachments.
            </p>
          </div>
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
        <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">All shipments</h2>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Containers</span>
              {(
                [
                  ["all", "All"],
                  ["mine", "My shipments"],
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
                onClick={() => void load()}
                className="ml-1 text-xs font-medium text-zinc-600 underline dark:text-zinc-400"
              >
                Refresh
              </button>
            </div>
          </div>

          {selectedOrgId ? (
            <>
              <label className="sr-only" htmlFor="shipments-overview-search">
                Search shipments and containers
              </label>
              <input
                id="shipments-overview-search"
                type="search"
                placeholder="Search reference, BOL, carrier, or container…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                disabled={loading}
                className={`mb-4 ${SEARCH_INPUT_CLASS}`}
              />

              {error ? <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p> : null}

              <DataTable
                columns={columns}
                rows={rows}
                getRowId={(r) => r.id}
                loading={loading}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSortChange={handleSortChange}
                emptyMessage={
                  listFilter === "all"
                    ? "No shipments yet. Create tracking from the dashboard."
                    : "No shipments match this filter."
                }
                onRowClick={(r) => router.push(`/shipments/${r.id}`)}
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
            <p className="py-4 text-sm text-zinc-500">Select an organization to load shipments.</p>
          )}
        </section>
      )}

      {selectedOrgId ? (
        <BolImportDialog
          open={bolImportOpen}
          onClose={() => setBolImportOpen(false)}
          organizationId={selectedOrgId}
          onImported={() => void load()}
        />
      ) : null}
    </div>
  );
}
