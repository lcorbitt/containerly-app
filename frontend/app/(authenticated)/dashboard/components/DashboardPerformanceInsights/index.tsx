"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import {
  DASHBOARD_PERFORMANCE_CARD_CLASS,
  DASHBOARD_PERFORMANCE_CARD_DETAIL_CLASS,
  DASHBOARD_PERFORMANCE_CARD_TITLE_CLASS,
  DASHBOARD_PERFORMANCE_CARD_VALUE_CLASS,
  DASHBOARD_PERFORMANCE_EMPTY_CLASS,
  DASHBOARD_PERFORMANCE_GRID_CLASS,
  DASHBOARD_PERFORMANCE_LIST_CLASS,
  DASHBOARD_PERFORMANCE_ROW_CLASS,
  DASHBOARD_PERFORMANCE_SECTION_CLASS,
} from "./constants";
import type { DashboardPerformanceInsightsProps } from "./types";
import { formatHoursLabel, performanceInsightsHasData } from "./utils";

export function DashboardPerformanceInsights({
  insights,
  loading = false,
}: DashboardPerformanceInsightsProps) {
  if (loading) {
    return (
      <section className={DASHBOARD_PERFORMANCE_SECTION_CLASS} aria-busy="true">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Performance</h2>
        <div className="mt-4 flex min-h-24 items-center justify-center gap-2 text-sm text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading performance insights…
        </div>
      </section>
    );
  }

  if (!performanceInsightsHasData(insights)) {
    return (
      <section className={DASHBOARD_PERFORMANCE_SECTION_CLASS}>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Performance</h2>
        <p className={`mt-2 ${DASHBOARD_PERFORMANCE_EMPTY_CLASS}`}>
          Performance insights will appear as your team runs more shipments through Containerly.
        </p>
      </section>
    );
  }

  const data = insights!;

  return (
    <section className={DASHBOARD_PERFORMANCE_SECTION_CLASS} aria-labelledby="dashboard-performance-heading">
      <div>
        <h2 id="dashboard-performance-heading" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Performance
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          How your shipments are running — top drivers, bottlenecks, and customer wait times.
        </p>
      </div>

      <div className={DASHBOARD_PERFORMANCE_GRID_CLASS}>
        <div className={DASHBOARD_PERFORMANCE_CARD_CLASS}>
          <p className={DASHBOARD_PERFORMANCE_CARD_TITLE_CLASS}>Top delay drivers</p>
          {data.top_delay_drivers.length === 0 ? (
            <p className={`mt-2 ${DASHBOARD_PERFORMANCE_EMPTY_CLASS}`}>No active triage items.</p>
          ) : (
            <ul className={DASHBOARD_PERFORMANCE_LIST_CLASS}>
              {data.top_delay_drivers.map((driver) => (
                <li key={driver.bucket_key} className={DASHBOARD_PERFORMANCE_ROW_CLASS}>
                  <span>{driver.label}</span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {driver.count} ({driver.percentage}%)
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={DASHBOARD_PERFORMANCE_CARD_CLASS}>
          <p className={DASHBOARD_PERFORMANCE_CARD_TITLE_CLASS}>Slowest workflow step</p>
          {data.slowest_workflow_step ? (
            <>
              <p className={DASHBOARD_PERFORMANCE_CARD_VALUE_CLASS}>
                {data.slowest_workflow_step.label}
              </p>
              <p className={DASHBOARD_PERFORMANCE_CARD_DETAIL_CLASS}>
                Avg {data.slowest_workflow_step.avg_days} days in step (
                {data.slowest_workflow_step.sample_count} shipments)
              </p>
            </>
          ) : (
            <p className={`mt-2 ${DASHBOARD_PERFORMANCE_EMPTY_CLASS}`}>Not enough workflow data yet.</p>
          )}
        </div>

        <div className={DASHBOARD_PERFORMANCE_CARD_CLASS}>
          <p className={DASHBOARD_PERFORMANCE_CARD_TITLE_CLASS}>Customers waiting longest</p>
          {data.waiting_customers.length === 0 ? (
            <p className={`mt-2 ${DASHBOARD_PERFORMANCE_EMPTY_CLASS}`}>No customers waiting on a reply.</p>
          ) : (
            <ul className={DASHBOARD_PERFORMANCE_LIST_CLASS}>
              {data.waiting_customers.map((row) => (
                <li key={row.shipment_id}>
                  <Link
                    href={`/shipments/${row.shipment_id}?tab=messages`}
                    className="block rounded-md px-1 py-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <div className={DASHBOARD_PERFORMANCE_ROW_CLASS}>
                      <span className="truncate">
                        {row.order_number ?? row.customer_name ?? "Shipment"}
                      </span>
                      <span className="shrink-0 font-medium tabular-nums">
                        {formatHoursLabel(row.waiting_hours)}
                      </span>
                    </div>
                    {row.last_message_preview ? (
                      <p className="mt-0.5 truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                        {row.last_message_preview}
                      </p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={DASHBOARD_PERFORMANCE_CARD_CLASS}>
          <p className={DASHBOARD_PERFORMANCE_CARD_TITLE_CLASS}>Doc turnaround</p>
          <p className={DASHBOARD_PERFORMANCE_CARD_VALUE_CLASS}>
            {data.doc_turnaround.rejection_rate_percent}% rejection rate
          </p>
          <p className={DASHBOARD_PERFORMANCE_CARD_DETAIL_CLASS}>
            {data.doc_turnaround.approval_count} approved · {data.doc_turnaround.rejection_count}{" "}
            rejected
            {data.doc_turnaround.avg_approval_days != null
              ? ` · avg ${data.doc_turnaround.avg_approval_days}d to approve`
              : ""}
          </p>
          {data.response_time.median_hours != null ? (
            <p className={`mt-2 ${DASHBOARD_PERFORMANCE_CARD_DETAIL_CLASS}`}>
              Median operator response: {formatHoursLabel(data.response_time.median_hours)} (
              {data.response_time.sample_count} replies)
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
