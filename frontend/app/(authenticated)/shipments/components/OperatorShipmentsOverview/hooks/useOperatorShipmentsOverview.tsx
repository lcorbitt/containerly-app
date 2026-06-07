"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import {
  deleteCommercialShipment,
  loadOperatorShipmentsOverviewPageBrowser,
  type OperatorShipmentScope,
  type ShipmentOverviewRow,
} from "@/services/shipment.service";
import { parseOperatorShipmentDateRangeFilter } from "@/utils/operator-shipment-date-filters";
import {
  DEFAULT_OPERATOR_SHIPMENT_SORT_COLUMN,
  defaultSortDirectionForOperatorShipmentColumn,
  normalizeOperatorShipmentSortColumn,
  type OperatorShipmentSortColumn,
} from "@/utils/operator-shipment-sort";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { useConfirm } from "@/contexts/confirm-dialog";
import { useToast } from "@/contexts/toast";
import { TRACKING_CREATED_EVENT } from "@/utils/tracking-created-event";
import { fetchProfileDisplayNameMap } from "@/services/profile.service";
import { canManageOrganizationSettings } from "@/utils/org-role";
import type { DataTableColumn } from "@/components/DataTable";
import { ShipmentWorkflowStatusPill } from "@/components/StatusPills";
import {
  SHIPMENT_OVERVIEW_ACTIONS_CELL_CLASS,
  SHIPMENT_OVERVIEW_ACTIONS_CELL_INNER_CLASS,
  SHIPMENT_OVERVIEW_ACTIONS_HEADER_CLASS,
  SHIPMENT_OVERVIEW_DELETE_BUTTON_CLASS,
} from "../constants";
import { ShipmentOverviewTagsCell } from "../ShipmentOverviewTagsCell";
import { ShipmentOverviewAssigneeCell } from "../ShipmentOverviewAssigneeCell";
import { SHIPMENT_OVERVIEW_DATE_CELL_CLASS } from "../ShipmentOverviewDateFilters/constants";
import { displayOverviewText, formatOverviewDate } from "../utils";

export function useOperatorShipmentsOverview() {
  const router = useRouter();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const { orgs, selectedOrgId, isSuperAdmin } = useOrganizationWorkspace();

  const [rows, setRows] = useState<ShipmentOverviewRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listFilter, setListFilter] = useState<OperatorShipmentScope>("all");
  const [peopleLabels, setPeopleLabels] = useState<Record<string, string>>({});
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sortColumn, setSortColumn] = useState<OperatorShipmentSortColumn>(
    DEFAULT_OPERATOR_SHIPMENT_SORT_COLUMN,
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [etdFrom, setEtdFrom] = useState("");
  const [etdTo, setEtdTo] = useState("");
  const [etaFrom, setEtaFrom] = useState("");
  const [etaTo, setEtaTo] = useState("");
  const [deletingShipmentId, setDeletingShipmentId] = useState<string | null>(null);

  const selectedMembershipRole = orgs.find((o) => o.organizations?.id === selectedOrgId)?.role;
  const canDeleteShipments = canManageOrganizationSettings(isSuperAdmin, selectedMembershipRole);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(0);
    }, 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(0);
  }, [listFilter, pageSize, sortColumn, sortDirection, tagFilter, etdFrom, etdTo, etaFrom, etaTo]);

  const dateRangeFilter = useMemo(
    () => parseOperatorShipmentDateRangeFilter({ etaFrom, etaTo, etdFrom, etdTo }),
    [etaFrom, etaTo, etdFrom, etdTo],
  );

  const load = useCallback(async () => {
    if (!selectedOrgId) return;
    setLoading(true);
    setError(null);
    try {
      const { rows: data, totalCount: count } = await loadOperatorShipmentsOverviewPageBrowser({
        organizationId: selectedOrgId,
        scope: listFilter,
        search: debouncedSearch,
        tagFilter,
        dateRangeFilter,
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
  }, [selectedOrgId, listFilter, debouncedSearch, tagFilter, dateRangeFilter, sortColumn, sortDirection, page, pageSize]);

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
        setSortDirection(defaultSortDirectionForOperatorShipmentColumn(col));
      }
    },
    [sortColumn],
  );

  const handleTagFilter = useCallback(
    (tag: string | null) => {
      setTagFilter(tag);
      if (tag) {
        setSortColumn("tags");
        setSortDirection("asc");
      }
    },
    [],
  );

  const clearTagFilter = useCallback(() => {
    setTagFilter(null);
  }, []);

  const clearDateFilters = useCallback(() => {
    setEtdFrom("");
    setEtdTo("");
    setEtaFrom("");
    setEtaTo("");
  }, []);

  const handleDeleteShipment = useCallback(
    async (row: ShipmentOverviewRow) => {
      if (!selectedOrgId || !canDeleteShipments) return;
      const label = row.order_number?.trim() || row.customer_name?.trim() || "this shipment";
      const ok = await confirm({
        title: "Delete Shipment?",
        description: `Permanently delete ${label}? This removes documents, messages, and tracking linked to the shipment.`,
        confirmLabel: "Delete",
        cancelLabel: "Cancel",
        variant: "danger",
      });
      if (!ok) return;

      setDeletingShipmentId(row.id);
      try {
        const result = await deleteCommercialShipment({
          organization_id: selectedOrgId,
          shipment_id: row.id,
        });
        if (!result.ok) {
          toast(result.error, "error");
          return;
        }
        toast("Shipment deleted", "success");
        await load();
      } catch (e) {
        toast(e instanceof Error ? e.message : "Could not delete shipment", "error");
      } finally {
        setDeletingShipmentId(null);
      }
    },
    [canDeleteShipments, confirm, load, selectedOrgId, toast],
  );

  const columns: DataTableColumn<ShipmentOverviewRow>[] = useMemo(
    () => {
      const base: DataTableColumn<ShipmentOverviewRow>[] = [
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
        id: "assignee",
        header: "Assignee",
        sortable: true,
        className: "w-16",
        headerClassName: "whitespace-nowrap",
        cell: (r) => (
          <ShipmentOverviewAssigneeCell
            assigneeUserId={r.assignee_user_id}
            label={r.assignee_user_id ? (peopleLabels[r.assignee_user_id] ?? null) : null}
          />
        ),
      },
      {
        id: "tags",
        header: "Tags",
        sortable: true,
        className: "max-w-[10rem] w-[10rem]",
        headerClassName: "whitespace-nowrap",
        cell: (r) => (
          <ShipmentOverviewTagsCell
            tags={r.tags ?? []}
            activeTagFilter={tagFilter}
            onTagFilter={handleTagFilter}
          />
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
        id: "estimated_departure_at",
        header: "ETD",
        sortable: true,
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
        headerClassName: "whitespace-nowrap",
        cell: (r) => (
          <span className={SHIPMENT_OVERVIEW_DATE_CELL_CLASS}>
            {formatOverviewDate(r.estimated_arrival_at)}
          </span>
        ),
      },
      ];

      if (canDeleteShipments) {
        base.push({
          id: "actions",
          header: "Actions",
          headerClassName: SHIPMENT_OVERVIEW_ACTIONS_HEADER_CLASS,
          className: SHIPMENT_OVERVIEW_ACTIONS_CELL_CLASS,
          cell: (r) => (
            <div className={SHIPMENT_OVERVIEW_ACTIONS_CELL_INNER_CLASS}>
              <button
                type="button"
                aria-label={`Delete shipment ${r.order_number}`}
                disabled={deletingShipmentId === r.id}
                onClick={(e) => {
                  e.stopPropagation();
                  void handleDeleteShipment(r);
                }}
                className={SHIPMENT_OVERVIEW_DELETE_BUTTON_CLASS}
              >
                {deletingShipmentId === r.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden />
                )}
              </button>
            </div>
          ),
        });
      }

      return base;
    },
    [canDeleteShipments, deletingShipmentId, handleDeleteShipment, handleTagFilter, peopleLabels, tagFilter],
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
    tagFilter,
    clearTagFilter,
    etdFrom,
    setEtdFrom,
    etdTo,
    setEtdTo,
    etaFrom,
    setEtaFrom,
    etaTo,
    setEtaTo,
    clearDateFilters,
    load,
    handleSortChange,
    columns,
    navigateToShipment,
  };
}
