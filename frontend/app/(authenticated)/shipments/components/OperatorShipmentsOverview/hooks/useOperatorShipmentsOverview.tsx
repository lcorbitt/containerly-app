"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatTimestamp } from "@/utils/datetime";
import {
  containerCount,
  loadOperatorShipmentsOverviewPageBrowser,
  maxLastSyncIso,
  normalizeOperatorShipmentSortColumn,
  pickTrackingRowsExported,
  type OperatorShipmentScope,
  type OperatorShipmentSortColumn,
  type ShipmentOverviewRow,
  type ShipmentOverviewTrackingRow,
} from "@/services/shipment.service";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { TRACKING_CREATED_EVENT } from "@/utils/tracking-created-event";
import { fetchProfileDisplayNameMap } from "@/services/profile.service";
import type { DataTableColumn } from "@/components/DataTable";
import { TrackingWorkflowStatusPill } from "@/components/StatusPills";

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

export function useOperatorShipmentsOverview() {
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
      const { rows: data, totalCount: count } = await loadOperatorShipmentsOverviewPageBrowser({
        organizationId: selectedOrgId,
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
      const map = await fetchProfileDisplayNameMap(peopleIds);
      setPeopleLabels(map);
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

  const navigateToShipment = useCallback(
    (r: ShipmentOverviewRow) => router.push(`/shipments/${r.id}`),
    [router],
  );

  return {
    orgs,
    selectedOrgId,
    isSuperAdmin,
    rows,
    totalCount,
    loading,
    error,
    listFilter,
    setListFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    sortColumn,
    sortDirection,
    searchInput,
    setSearchInput,
    bolImportOpen,
    setBolImportOpen,
    load,
    handleSortChange,
    columns,
    navigateToShipment,
  };
}
