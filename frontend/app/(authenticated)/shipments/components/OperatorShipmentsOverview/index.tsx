"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { BolImportDialog } from "@/components/BolImportDialog";
import { DataTable } from "@/components/DataTable";
import { TablePagination } from "@/components/TablePagination";
import { useOperatorShipmentsOverview } from "./hooks/useOperatorShipmentsOverview";

const SEARCH_INPUT_CLASS =
  "w-full max-w-md rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400/30 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500";

const filterButtonClass = (active: boolean) =>
  `rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
    active
      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
  }`;

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
    bolImportOpen,
    setBolImportOpen,
    load,
    handleSortChange,
    columns,
    navigateToShipment,
  } = useOperatorShipmentsOverview();

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
              JSONCargo's{" "}
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
