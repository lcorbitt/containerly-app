"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import {
  DASHBOARD_PERFORMANCE_CELL_CLASS,
  DASHBOARD_PERFORMANCE_CELL_DETAIL_CLASS,
  DASHBOARD_PERFORMANCE_CELL_TITLE_CLASS,
  DASHBOARD_PERFORMANCE_EMPTY_CLASS,
  DASHBOARD_PERFORMANCE_GRID_CLASS,
  DASHBOARD_PERFORMANCE_LIST_CLASS,
  DASHBOARD_PERFORMANCE_LOADING_CLASS,
  DASHBOARD_PERFORMANCE_PANEL_BODY_CLASS,
  DASHBOARD_PERFORMANCE_PANEL_CLASS,
  DASHBOARD_PERFORMANCE_ROW_CLASS,
  DASHBOARD_PERFORMANCE_ROW_LINK_CLASS,
  DASHBOARD_PERFORMANCE_ROW_PREVIEW_CLASS,
  DASHBOARD_PERFORMANCE_CARD_VALUE_CLASS,
  DASHBOARD_SECTION_DESC_CLASS,
  DASHBOARD_SECTION_TITLE_CLASS,
} from "./constants";
import type { DashboardPerformanceInsightsProps } from "./types";
import { formatHoursLabel, performanceInsightsHasData } from "./utils";

export function DashboardPerformanceInsights({
  insights,
  loading = false,
}: DashboardPerformanceInsightsProps) {
  if (loading) {
    return (
      <section className={DASHBOARD_PERFORMANCE_PANEL_CLASS} aria-busy="true">
        <div className={DASHBOARD_PERFORMANCE_PANEL_BODY_CLASS}>
          <h2 className={DASHBOARD_SECTION_TITLE_CLASS}>Performance</h2>
          <div className={DASHBOARD_PERFORMANCE_LOADING_CLASS}>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            <span>Loading…</span>
          </div>
        </div>
      </section>
    );
  }

  if (!performanceInsightsHasData(insights)) {
    return (
      <section className={DASHBOARD_PERFORMANCE_PANEL_CLASS}>
        <div className={DASHBOARD_PERFORMANCE_PANEL_BODY_CLASS}>
          <h2 className={DASHBOARD_SECTION_TITLE_CLASS}>Performance</h2>
          <p className={`mt-4 ${DASHBOARD_PERFORMANCE_EMPTY_CLASS}`}>
            Insights will appear as your team runs more shipments through Containerly.
          </p>
        </div>
      </section>
    );
  }

  const data = insights!;

  return (
    <section className={DASHBOARD_PERFORMANCE_PANEL_CLASS} aria-labelledby="dashboard-performance-heading">
      <div className={DASHBOARD_PERFORMANCE_PANEL_BODY_CLASS}>
        <div className="mb-6">
          <h2 id="dashboard-performance-heading" className={DASHBOARD_SECTION_TITLE_CLASS}>
            Performance
          </h2>
          <p className={DASHBOARD_SECTION_DESC_CLASS}>
            Carriers with delays, workflow bottlenecks, and customer wait times.
          </p>
        </div>

        <div className={DASHBOARD_PERFORMANCE_GRID_CLASS}>
          <div className={DASHBOARD_PERFORMANCE_CELL_CLASS}>
            <p className={DASHBOARD_PERFORMANCE_CELL_TITLE_CLASS}>Top delay carriers</p>
            {data.top_delay_carriers.length === 0 ? (
              <p className={`mt-3 ${DASHBOARD_PERFORMANCE_EMPTY_CLASS}`}>No carrier delays detected.</p>
            ) : (
              <ul className={DASHBOARD_PERFORMANCE_LIST_CLASS}>
                {data.top_delay_carriers.map((carrier) => (
                  <li key={carrier.carrier_key} className={DASHBOARD_PERFORMANCE_ROW_CLASS}>
                    <span>{carrier.label}</span>
                    <span className="shrink-0 tabular-nums text-zinc-900 dark:text-zinc-100">
                      {carrier.count}
                      <span className="text-zinc-400 dark:text-zinc-500"> · {carrier.percentage}%</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={DASHBOARD_PERFORMANCE_CELL_CLASS}>
            <p className={DASHBOARD_PERFORMANCE_CELL_TITLE_CLASS}>Slowest workflow step</p>
            {data.slowest_workflow_step ? (
              <>
                <p className={`${DASHBOARD_PERFORMANCE_CARD_VALUE_CLASS} !mt-3 !text-xl`}>
                  {data.slowest_workflow_step.label}
                </p>
                <p className={DASHBOARD_PERFORMANCE_CELL_DETAIL_CLASS}>
                  Avg {data.slowest_workflow_step.avg_days} days · {data.slowest_workflow_step.sample_count}{" "}
                  shipments
                </p>
              </>
            ) : (
              <p className={`mt-3 ${DASHBOARD_PERFORMANCE_EMPTY_CLASS}`}>Not enough workflow data yet.</p>
            )}
          </div>

          <div className={DASHBOARD_PERFORMANCE_CELL_CLASS}>
            <p className={DASHBOARD_PERFORMANCE_CELL_TITLE_CLASS}>Customers waiting longest</p>
            {data.waiting_customers.length === 0 ? (
              <p className={`mt-3 ${DASHBOARD_PERFORMANCE_EMPTY_CLASS}`}>No customers waiting on a reply.</p>
            ) : (
              <ul className={DASHBOARD_PERFORMANCE_LIST_CLASS}>
                {data.waiting_customers.map((row) => (
                  <li key={row.shipment_id}>
                    <Link
                      href={`/shipments/${row.shipment_id}?tab=messages`}
                      className={DASHBOARD_PERFORMANCE_ROW_LINK_CLASS}
                    >
                      <div className={DASHBOARD_PERFORMANCE_ROW_CLASS}>
                        <span className="truncate">
                          {row.order_number ?? row.customer_name ?? "Shipment"}
                        </span>
                        <span className="shrink-0 tabular-nums text-zinc-900 dark:text-zinc-100">
                          {formatHoursLabel(row.waiting_hours)}
                        </span>
                      </div>
                      {row.last_message_preview ? (
                        <p className={DASHBOARD_PERFORMANCE_ROW_PREVIEW_CLASS}>{row.last_message_preview}</p>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={DASHBOARD_PERFORMANCE_CELL_CLASS}>
            <p className={DASHBOARD_PERFORMANCE_CELL_TITLE_CLASS}>Doc turnaround</p>
            <p className={`${DASHBOARD_PERFORMANCE_CARD_VALUE_CLASS} !mt-3 !text-xl`}>
              {data.doc_turnaround.rejection_rate_percent}%
              <span className="text-base font-normal text-zinc-500 dark:text-zinc-400"> rejection</span>
            </p>
            <p className={DASHBOARD_PERFORMANCE_CELL_DETAIL_CLASS}>
              {data.doc_turnaround.approval_count} approved · {data.doc_turnaround.rejection_count} rejected
              {data.doc_turnaround.avg_approval_days != null
                ? ` · ${data.doc_turnaround.avg_approval_days}d avg to approve`
                : ""}
            </p>
            {data.response_time.median_hours != null ? (
              <p className={`mt-3 ${DASHBOARD_PERFORMANCE_CELL_DETAIL_CLASS}`}>
                Median reply {formatHoursLabel(data.response_time.median_hours)} ·{" "}
                {data.response_time.sample_count} responses
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
