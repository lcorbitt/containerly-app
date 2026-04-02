"use client";

import { getShipmentDetailRows } from "@/lib/jsoncargo-display";

export function ShipmentDetailsPanel({
  location,
  title = "Shipment details",
  subtitle,
  className = "",
}: {
  location: Record<string, unknown> | null | undefined;
  title?: string;
  subtitle?: string;
  className?: string;
}) {
  const rows = getShipmentDetailRows(location ?? null);
  if (rows.length === 0) return null;

  return (
    <div
      className={`rounded-xl border border-zinc-200/90 bg-zinc-50/40 p-4 dark:border-zinc-800 dark:bg-zinc-900/25 sm:p-5 ${className}`}
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
        {subtitle ? (
          <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{subtitle}</p>
        ) : null}
      </div>
      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        {rows.map(({ key, label, value }) => (
          <div key={key} className="min-w-0">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              {label}
            </dt>
            <dd className="mt-1 text-sm leading-snug text-zinc-900 dark:text-zinc-100">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
