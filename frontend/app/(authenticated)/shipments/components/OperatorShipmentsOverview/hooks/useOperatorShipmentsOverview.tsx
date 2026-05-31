"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatTimestamp } from "@/utils/datetime";
import {
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
import { ShipmentWorkflowStatusPill, TrackingWorkflowStatusPill } from "@/components/StatusPills";
import { displayOverviewText, formatOverviewDate } from "../utils";

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
      const map = await fetchProfileDisplayNameMap(assigneeIds);
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
        setSortDirection(col === "order_number" || col === "bill_of_lading" ? "asc" : "desc");
      }
    },
    [sortColumn],
  );

  const columns: DataTableColumn<ShipmentOverviewRow>[] = useMemo(
    () => [
      {
        id: "order_number",
        header: "Order no.",
        sortable: true,
        cell: (r) => (
          <span className="font-medium text-zinc-900 dark:text-zinc-50">{r.order_number}</span>
        ),
      },
      {
        id: "customer_name",
        header: "Customer",
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
        id: "container_number",
        header: "Container no.",
        cell: (r) => (
          <span className="font-mono text-xs text-zinc-800 dark:text-zinc-200">
            {displayOverviewText(r.container_number)}
          </span>
        ),
      },
      {
        id: "assignee",
        header: "Assignee",
        cell: (r) => {
          const label = r.assignee_user_id ? peopleLabels[r.assignee_user_id] : null;
          if (!label) return <span className="text-zinc-500">Unassigned</span>;
          return (
            <span className="max-w-[10rem] truncate text-sm text-zinc-700 dark:text-zinc-300" title={label}>
              {label}
            </span>
          );
        },
      },
      {
        id: "workflow_status",
        header: "Documents",
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
        cell: (r) => (
          <span className="whitespace-nowrap text-xs tabular-nums text-zinc-700 dark:text-zinc-300">
            {formatOverviewDate(r.estimated_arrival_at)}
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
    load,
    handleSortChange,
    columns,
    navigateToShipment,
  };
}
