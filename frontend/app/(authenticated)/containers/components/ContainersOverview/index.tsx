"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { TablePagination } from "@/components/TablePagination";
import { TextInput } from "@/components/TextInput";
import { useOrganizationWorkspace } from "@/atoms/organization-workspace";
import { useOrganizationMetricsQuery } from "@/hooks/queries/useOrganization";
import { useOperatorContainersQuery } from "@/hooks/queries/useTracking";
import type { OperatorRequestScope } from "@/utils/operator-tracking-requests";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { TABLE_SEARCH_DEBOUNCE_MS } from "@/utils/table-search-debounce";
import { useEffect, useState } from "react";
import {
  CONTAINERS_FILTER_ACTIVE_CLASS,
  CONTAINERS_FILTER_INACTIVE_CLASS,
  CONTAINERS_GROWTH_CALLOUT_CLASS,
  CONTAINERS_OVERVIEW_PANEL_CLASS,
  CONTAINERS_OVERVIEW_ROW_CLASS,
  CONTAINERS_SCOPE_FILTERS,
} from "./constants";

const TRACKING_STATUS_LABELS: Record<string, string> = {
  pending: "Sync Pending",
  syncing: "Syncing",
  active: "Carrier Active",
  completed: "Sync Complete",
  failed: "Sync Failed",
};

function trackingStatusLabel(status: string): string {
  return TRACKING_STATUS_LABELS[status.toLowerCase()] ?? status.replace(/_/g, " ");
}

export function ContainersOverview() {
  const { selectedOrgId } = useOrganizationWorkspace();
  const metricsQuery = useOrganizationMetricsQuery(selectedOrgId);
  const [scope, setScope] = useState<OperatorRequestScope>("all");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, TABLE_SEARCH_DEBOUNCE_MS);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    setPage(0);
  }, [scope, debouncedSearch, pageSize]);

  const query = useOperatorContainersQuery({
    organizationId: selectedOrgId,
    scope,
    search: debouncedSearch,
    page,
    pageSize,
    sortColumn: "last_sync_at",
    sortDirection: "desc",
  });

  const hasTracking = (metricsQuery.data?.trackingRequests ?? 0) > 0;

  if (!selectedOrgId) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Select an organization to view containers.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {!hasTracking && !query.isLoading ? (
        <p className={CONTAINERS_GROWTH_CALLOUT_CLASS}>
          Carrier and container tracking is a Growth feature. Add tracking lines to shipments to
          populate this fleet view.
        </p>
      ) : null}

      <TextInput
        id="containers-overview-search"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        placeholder="Search container or BOL…"
        className="max-w-md"
      />

      <div className="flex flex-wrap gap-2 rounded-xl bg-zinc-50/80 p-2 dark:bg-zinc-900/80">
        {CONTAINERS_SCOPE_FILTERS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setScope(id)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              scope === id ? CONTAINERS_FILTER_ACTIVE_CLASS : CONTAINERS_FILTER_INACTIVE_CLASS
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <section className={CONTAINERS_OVERVIEW_PANEL_CLASS} aria-busy={query.isLoading}>
        {query.isLoading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-12 text-sm text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading containers…
          </div>
        ) : (query.data?.rows.length ?? 0) === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No carrier lines match this filter.
          </p>
        ) : (
          <ul>
            {(query.data?.rows ?? []).map((row) => (
              <li key={row.id}>
                <Link
                  href={row.container_id ? `/containers/${row.container_id}` : "/shipments"}
                  className={CONTAINERS_OVERVIEW_ROW_CLASS}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {row.container_number}
                      </p>
                      {row.source_bill_of_lading ? (
                        <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
                          BOL {row.source_bill_of_lading}
                        </p>
                      ) : null}
                      {row.error_message ? (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {row.error_message}
                        </p>
                      ) : null}
                    </div>
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                      {trackingStatusLabel(row.status)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {(query.data?.totalCount ?? 0) > pageSize ? (
        <TablePagination
          page={page}
          pageSize={pageSize}
          totalCount={query.data?.totalCount ?? 0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      ) : null}
    </div>
  );
}
