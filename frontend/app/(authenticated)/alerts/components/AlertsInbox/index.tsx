"use client";

import Link from "next/link";
import type { PendingAccessRequestRow } from "@/services/organization.service";
import { Loader2 } from "lucide-react";
import { DashboardActionItemRow } from "@/app/(authenticated)/dashboard/components/DashboardAlertsPanel/DashboardActionItemRow";
import { buildAlertListItems } from "@/app/(authenticated)/dashboard/components/DashboardAlertsPanel/utils";
import {
  ALERTS_ACCESS_REQUEST_ROW_CLASS,
  ALERTS_INBOX_FILTER_BUTTON_ACTIVE_CLASS,
  ALERTS_INBOX_FILTER_BUTTON_INACTIVE_CLASS,
  ALERTS_INBOX_FILTERS,
  ALERTS_INBOX_LIST_CLASS,
  ALERTS_INBOX_PANEL_CLASS,
} from "./constants";
import { useAlertsInbox } from "./useAlertsInbox";

export function AlertsInbox() {
  const {
    loading,
    filter,
    setFilter,
    filteredItems,
    accessRequests,
    filterCounts,
    isFreight,
    selectedOrgId,
  } = useAlertsInbox();

  if (!isFreight) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Alerts are available for freight operator workspaces.
      </p>
    );
  }

  if (!selectedOrgId) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Select an organization to view alerts.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div
        role="tablist"
        aria-label="Alert filters"
        className="flex flex-wrap gap-2 rounded-xl bg-zinc-50/80 p-2 dark:bg-zinc-900/80"
      >
        {ALERTS_INBOX_FILTERS.map(({ id, label }) => {
          const count = filterCounts[id] ?? 0;
          const active = filter === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(id)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? ALERTS_INBOX_FILTER_BUTTON_ACTIVE_CLASS
                  : ALERTS_INBOX_FILTER_BUTTON_INACTIVE_CLASS
              }`}
            >
              {label}
              {count > 0 ? (
                <span className="ml-1.5 text-xs opacity-70">({count})</span>
              ) : null}
            </button>
          );
        })}
      </div>

      <section className={ALERTS_INBOX_PANEL_CLASS} aria-busy={loading}>
        {loading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-12 text-sm text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading alerts…
          </div>
        ) : filteredItems.length === 0 && accessRequests.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Nothing needs your attention right now.
          </p>
        ) : (
          <ul className={ALERTS_INBOX_LIST_CLASS}>
            {accessRequests.map((request: PendingAccessRequestRow) => (
              <li key={request.id}>
                <Link
                  href={`/shipments/${request.shipment_id}`}
                  className={ALERTS_ACCESS_REQUEST_ROW_CLASS}
                >
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Access Request
                  </p>
                  <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
                    {request.requester_email}
                    {request.order_number ? ` · ${request.order_number}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                    Pending portal access approval
                  </p>
                </Link>
              </li>
            ))}
            {filteredItems.map((item, index) => (
              <li key={`${item.containerId}-${item.bucketKey}-${index}`}>
                <DashboardActionItemRow item={item} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
