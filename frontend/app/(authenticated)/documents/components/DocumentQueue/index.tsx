"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { TablePagination } from "@/components/TablePagination";
import { TextInput } from "@/components/TextInput";
import { ShipmentWorkflowStatusPill } from "@/components/StatusPills";
import { shipmentWorkflowDisplayLabel } from "@/utils/shipment-workflow-status";
import {
  DOCUMENT_QUEUE_FILTER_ACTIVE_CLASS,
  DOCUMENT_QUEUE_FILTER_INACTIVE_CLASS,
  DOCUMENT_QUEUE_FILTERS,
  DOCUMENT_QUEUE_PANEL_CLASS,
  DOCUMENT_QUEUE_ROW_CLASS,
} from "./constants";
import { useDocumentQueue } from "./useDocumentQueue";

export function DocumentQueue() {
  const {
    loading,
    rows,
    totalCount,
    filter,
    setFilter,
    searchInput,
    setSearchInput,
    page,
    setPage,
    pageSize,
    setPageSize,
    selectedOrgId,
  } = useDocumentQueue();

  if (!selectedOrgId) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Select an organization to view the document queue.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TextInput
          id="document-queue-search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search order, customer, or lane…"
          className="max-w-md"
        />
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl bg-zinc-50/80 p-2 dark:bg-zinc-900/80">
        {DOCUMENT_QUEUE_FILTERS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              filter === id
                ? DOCUMENT_QUEUE_FILTER_ACTIVE_CLASS
                : DOCUMENT_QUEUE_FILTER_INACTIVE_CLASS
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <section className={DOCUMENT_QUEUE_PANEL_CLASS} aria-busy={loading}>
        {loading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-12 text-sm text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading document queue…
          </div>
        ) : rows.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No shipments match this workflow filter.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.map((row) => (
              <li key={row.id}>
                <Link
                  href={`/shipments/${row.id}?tab=documents`}
                  className={DOCUMENT_QUEUE_ROW_CLASS}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {row.order_number}
                      </p>
                      {row.customer_name ? (
                        <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
                          {row.customer_name}
                        </p>
                      ) : null}
                      {row.port_of_loading || row.port_of_destination ? (
                        <p className="mt-1 text-xs text-zinc-500">
                          {[row.port_of_loading, row.port_of_destination].filter(Boolean).join(" → ")}
                        </p>
                      ) : null}
                    </div>
                    {row.workflow_status ? (
                      <ShipmentWorkflowStatusPill status={row.workflow_status} compact />
                    ) : (
                      <span className="text-xs text-zinc-500">
                        {shipmentWorkflowDisplayLabel(row.workflow_status)}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {totalCount > pageSize ? (
        <TablePagination
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      ) : null}
    </div>
  );
}
