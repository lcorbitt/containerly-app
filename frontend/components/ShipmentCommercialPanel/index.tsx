"use client";

import type { ShipmentCommercialDetails } from "@shared/dto/logistics.dto";
import { ShipmentWorkflowStatusPill } from "@/components/StatusPills";
import { formatTimestamp } from "@/utils/datetime";

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return formatTimestamp(value);
}

export function ShipmentCommercialPanel({
  details,
  title = "Shipment details",
}: {
  details: ShipmentCommercialDetails | null | undefined;
  title?: string;
}) {
  if (!details) return null;

  const headerRows = [
    ["Customer", details.customer_name],
    ["Country", details.country],
    ["Port of loading", details.port_of_loading],
    ["Port of destination", details.port_of_destination],
    ["Est. departure", formatDate(details.estimated_departure_at)],
    ["Est. arrival", formatDate(details.estimated_arrival_at)],
    ["Freight booking carrier", details.freight_booking_carrier],
    ["Vessel", details.vessel],
    ["Voyage", details.voyage],
    ["Health certificate no.", details.health_certificate_no],
    ["Trade terms", details.trade_terms],
  ] as const;

  return (
    <div className="rounded-xl border border-zinc-200/90 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
        <ShipmentWorkflowStatusPill status={details.workflow_status} compact />
      </div>

      <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        {headerRows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">{label}</dt>
            <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{value?.trim() || "—"}</dd>
          </div>
        ))}
      </dl>

      {details.physical_mail_tracking_number ? (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100">
          Original documents mailed — tracking: {details.physical_mail_tracking_number}
        </p>
      ) : null}

      {details.lines.length > 0 ? (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-2 py-2">Order No.</th>
                <th className="px-2 py-2">Booking No.</th>
                <th className="px-2 py-2">Container</th>
                <th className="px-2 py-2">Customer</th>
                <th className="px-2 py-2">Country</th>
              </tr>
            </thead>
            <tbody>
              {details.lines.map((line) => (
                <tr key={line.id} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="px-2 py-2 font-mono text-xs">{line.order_number ?? "—"}</td>
                  <td className="px-2 py-2 font-mono text-xs">{line.carrier_booking_number ?? "—"}</td>
                  <td className="px-2 py-2 font-mono text-xs">{line.container_number ?? "—"}</td>
                  <td className="px-2 py-2">{line.customer_name ?? "—"}</td>
                  <td className="px-2 py-2">{line.country ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
