"use client";

import { DataTable } from "@/components/DataTable";
import { Reveal } from "@/components/Reveal";
import { TablePagination } from "@/components/TablePagination";
import { TextInput } from "@/components/TextInput";
import {
  IMPORTER_SHIPMENTS_EMPTY_MESSAGE,
  IMPORTER_SHIPMENTS_PANEL_CLASS,
  IMPORTER_SHIPMENTS_SUBTITLE,
  IMPORTER_SHIPMENTS_TITLE,
  SEARCH_INPUT_CLASS,
} from "./constants";
import { useImporterShipmentsList } from "./useImporterShipmentsList";

export function ImporterShipmentsList() {
  const {
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
  } = useImporterShipmentsList();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{IMPORTER_SHIPMENTS_TITLE}</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{IMPORTER_SHIPMENTS_SUBTITLE}</p>

      {error ? <p className="mt-6 text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      <Reveal show>
        <section className={IMPORTER_SHIPMENTS_PANEL_CLASS}>
          <label className="sr-only" htmlFor="shipments-search">
            Search shipments
          </label>
          <TextInput
            id="shipments-search"
            type="search"
            placeholder="Search organization, customer, container, BOL, or order no.…"
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
        </section>
      </Reveal>
    </div>
  );
}
