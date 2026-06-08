"use client";

import { DataTable, DataTableExportButton } from "@/components/DataTable";
import { Reveal } from "@/components/Reveal";
import { TablePagination } from "@/components/TablePagination";
import { TextInput } from "@/components/TextInput";
import { ShipmentOverviewDateFilters } from "@/app/(authenticated)/shipments/components/OperatorShipmentsOverview/ShipmentOverviewDateFilters";
import {
  SHIPMENT_OVERVIEW_PANEL_CLASS,
  SHIPMENT_OVERVIEW_SEARCH_CONTAINER_CLASS,
  SHIPMENT_OVERVIEW_SEARCH_INPUT_CLASS,
  SHIPMENT_OVERVIEW_TOOLBAR_CLASS,
} from "@/app/(authenticated)/shipments/components/OperatorShipmentsOverview/constants";
import {
  IMPORTER_SHIPMENTS_DATE_FILTER_EMPTY_MESSAGE,
  IMPORTER_SHIPMENTS_EMPTY_MESSAGE,
  IMPORTER_SHIPMENTS_SUBTITLE,
  IMPORTER_SHIPMENTS_TITLE,
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
    etdFrom,
    setEtdFrom,
    etdTo,
    setEtdTo,
    etaFrom,
    setEtaFrom,
    etaTo,
    setEtaTo,
    clearDateFilters,
    loading,
    error,
    handleSortChange,
    columns,
    navigateToShipment,
    tableExport,
  } = useImporterShipmentsList();

  const hasDateFilters = Boolean(etdFrom || etdTo || etaFrom || etaTo);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{IMPORTER_SHIPMENTS_TITLE}</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{IMPORTER_SHIPMENTS_SUBTITLE}</p>

      {error ? <p className="mt-6 text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      <Reveal show>
        <section className={`mt-6 ${SHIPMENT_OVERVIEW_PANEL_CLASS}`}>
          <div className={SHIPMENT_OVERVIEW_TOOLBAR_CLASS}>
            <label className="sr-only" htmlFor="shipments-search">
              Search shipments
            </label>
            <TextInput
              id="shipments-search"
              type="search"
              placeholder="Search order no., organization, customer…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              disabled={loading}
              containerClassName={SHIPMENT_OVERVIEW_SEARCH_CONTAINER_CLASS}
              className={SHIPMENT_OVERVIEW_SEARCH_INPUT_CLASS}
            />
          </div>

          <ShipmentOverviewDateFilters
            idPrefix="importer-shipments"
            etdFrom={etdFrom}
            etdTo={etdTo}
            etaFrom={etaFrom}
            etaTo={etaTo}
            disabled={loading}
            onEtdFromChange={setEtdFrom}
            onEtdToChange={setEtdTo}
            onEtaFromChange={setEtaFrom}
            onEtaToChange={setEtaTo}
            onClear={clearDateFilters}
            trailing={
              <DataTableExportButton
                columns={columns}
                exportConfig={tableExport}
                disabled={totalCount === 0 || loading}
              />
            }
          />

          <DataTable
            columns={columns}
            rows={rows}
            getRowId={(r) => r.id}
            loading={loading}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
            emptyMessage={
              hasDateFilters ? IMPORTER_SHIPMENTS_DATE_FILTER_EMPTY_MESSAGE : IMPORTER_SHIPMENTS_EMPTY_MESSAGE
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
        </section>
      </Reveal>
    </div>
  );
}
