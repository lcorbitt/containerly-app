"use client";

import type { ReactNode } from "react";
import {
  CarrierReportedStatusPill,
  TrackingWorkflowStatusPill,
} from "@/components/status-pills";
import { ShipmentDetailsPanel } from "@/components/shipment-details-panel";
import { riskInsightBadgeClass, type RiskLevel } from "@/lib/report-insights";

export type RequestSummaryProps = {
  containerNumber: string;
  workflowStatus: string;
  lastSyncDisplay: string;
  carrierLabel: string;
  carrierReportedStatus: string;
  lastKnownLocation: string | null;
  riskLevel: RiskLevel;
  headline: string;
  carrierDataFreshText: string;
  sharesTotal: number;
  linksActive: number;
  messagesTotal: number;
  activityTotal: number;
  /** JSON Cargo–shaped `containers.location` for enriched shipment grid. */
  shipmentLocation?: Record<string, unknown> | null;
};

function SummaryField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{children}</dd>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex min-w-[5.5rem] flex-col rounded-md bg-zinc-100/90 px-3 py-2 dark:bg-zinc-800/80">
      <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <span className="mt-0.5 text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
        {value}
      </span>
    </div>
  );
}

export function RequestSummary({
  containerNumber,
  workflowStatus,
  lastSyncDisplay,
  carrierLabel,
  carrierReportedStatus,
  lastKnownLocation,
  riskLevel,
  headline,
  carrierDataFreshText,
  sharesTotal,
  linksActive,
  messagesTotal,
  activityTotal,
  shipmentLocation,
}: RequestSummaryProps) {
  return (
    <section
      className="mb-6 overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      aria-labelledby="request-summary-heading"
    >
      <div className="border-b border-zinc-100 px-4 py-4 sm:px-5 sm:py-5 dark:border-zinc-800">
        <h2
          id="request-summary-heading"
          className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          Request summary
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Clear view of what customers see on shared links, carrier-provided shipment facts, and workspace
          activity.
        </p>
      </div>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:divide-x lg:divide-zinc-100 dark:lg:divide-zinc-800">
        <div className="p-4 sm:p-5 lg:min-h-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            On the shared link
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${riskInsightBadgeClass(riskLevel)}`}
            >
              {riskLevel.toUpperCase()} risk
            </span>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Carrier data · {carrierDataFreshText}
            </span>
          </div>
          <p className="mt-4 text-[15px] font-medium leading-snug text-zinc-800 dark:text-zinc-100">
            {headline}
          </p>
        </div>

        <div className="border-t border-zinc-100 p-4 sm:p-5 dark:border-zinc-800 lg:border-t-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Shipment &amp; workspace
          </p>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <SummaryField label="Container">
              <span className="font-mono text-[13px] font-semibold">{containerNumber}</span>
            </SummaryField>
            <SummaryField label="Tracking sync">
              <TrackingWorkflowStatusPill status={workflowStatus} />
            </SummaryField>
            <SummaryField label="Carrier">{carrierLabel || "—"}</SummaryField>
            <SummaryField label="Carrier-reported status">
              <CarrierReportedStatusPill status={carrierReportedStatus} />
            </SummaryField>
            <SummaryField label="Last known location">
              {lastKnownLocation ?? "—"}
            </SummaryField>
            <SummaryField label="Last sync">{lastSyncDisplay}</SummaryField>
          </dl>

          <div className="mt-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              Workspace
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatChip label="Links" value={sharesTotal} />
              <StatChip label="Active" value={linksActive} />
              <StatChip label="Messages" value={messagesTotal} />
              <StatChip label="Activity" value={activityTotal} />
            </div>
          </div>
        </div>
      </div>

      {shipmentLocation && Object.keys(shipmentLocation).length > 0 ? (
        <div className="border-t border-zinc-100 px-4 py-4 sm:px-5 sm:py-5 dark:border-zinc-800">
          <ShipmentDetailsPanel
            location={shipmentLocation}
            title="Carrier shipment details"
            subtitle="Fields from your tracking provider (JSON Cargo–style). Shown to customers when present on the shared report."
            className="border-zinc-200/70 bg-white dark:border-zinc-800 dark:bg-zinc-950/60"
          />
        </div>
      ) : null}
    </section>
  );
}
