"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { TablePagination } from "@/components/TablePagination";
import { TextInput } from "@/components/TextInput";
import {
  SHIPMENT_OVERVIEW_FILTERS_CLASS,
  SHIPMENT_OVERVIEW_SEARCH_CONTAINER_CLASS,
  SHIPMENT_OVERVIEW_SEARCH_INPUT_CLASS,
  SHIPMENT_OVERVIEW_TOOLBAR_CLASS,
  SHIPMENT_OVERVIEW_REFRESH_BUTTON_CLASS,
  shipmentOverviewFilterButtonClass,
} from "./constants";
import { useOperatorShipmentsOverview } from "./hooks/useOperatorShipmentsOverview";

export function OperatorShipmentsOverview({
  pageTitle = "Shipments",
  description,
}: {
  pageTitle?: string;
  description?: ReactNode;
}) {
  const {
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
  } = useOperatorShipmentsOverview();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
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
          {selectedOrgId ? (
            <>
              <div className={SHIPMENT_OVERVIEW_TOOLBAR_CLASS}>
                <label className="sr-only" htmlFor="shipments-overview-search">
                  Search shipments and containers
                </label>
                <TextInput
                  id="shipments-overview-search"
                  type="search"
                  placeholder="Search order no., customer, container, etc…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  disabled={loading}
                  containerClassName={SHIPMENT_OVERVIEW_SEARCH_CONTAINER_CLASS}
                  className={SHIPMENT_OVERVIEW_SEARCH_INPUT_CLASS}
                />
                <div className={SHIPMENT_OVERVIEW_FILTERS_CLASS}>
                  <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Scope</span>
                  {(
                    [
                      ["all", "All"],
                      ["mine", "My Shipments"],
                      ["unassigned", "Unassigned"],
                      ["participating", "Participating"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      className={shipmentOverviewFilterButtonClass(listFilter === id)}
                      onClick={() => setListFilter(id)}
                    >
                      {label}
                    </button>
                  ))}
                  <button
                    type="button"
                    aria-label="Refresh shipments"
                    title="Refresh"
                    disabled={loading}
                    onClick={() => void load()}
                    className={SHIPMENT_OVERVIEW_REFRESH_BUTTON_CLASS}
                  >
                    <RefreshCw
                      className={`h-4 w-4${loading ? " animate-spin" : ""}`}
                      strokeWidth={2}
                      aria-hidden
                    />
                  </button>
                </div>
              </div>

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
                    ? "No shipments yet. Create one from New Shipment — you'll upload documents and invite customers before optional carrier tracking."
                    : "No shipments match this filter."
                }
                onRowClick={navigateToShipment}
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
    </div>
  );
}
