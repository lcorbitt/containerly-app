"use client";

import Link from "next/link";
import { formatTimestamp } from "@/utils/datetime";
import { alertTypeIconConfig } from "@/utils/alert-display";
import type { Alert } from "@/types/database";

function customerAlertHref(alert: Alert): string | null {
  if (alert.shipment_id) return `/shipments/hub/${alert.shipment_id}`;
  return null;
}

function CustomerAlertRowBody({ alert }: { alert: Alert }) {
  const { Icon, className: iconColor } = alertTypeIconConfig(alert.alert_type);
  const unacked = !alert.acknowledged_at;

  return (
    <>
      <div className="flex min-h-11 items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center" aria-hidden>
          <Icon className={`h-4 w-4 ${iconColor}`} strokeWidth={2} />
        </span>
        <p
          className={`min-w-0 flex-1 line-clamp-4 text-xs leading-snug wrap-break-word ${
            unacked
              ? "font-medium text-zinc-900 dark:text-zinc-100"
              : "text-zinc-800 dark:text-zinc-200"
          }`}
        >
          {alert.message}
        </p>
      </div>
      <p className="mt-1.5 text-[10px] text-zinc-400 dark:text-zinc-500">
        <span>{formatTimestamp(alert.created_at)}</span>
      </p>
    </>
  );
}

export function CustomerNotificationsList({
  alerts,
  onItemNavigate,
}: {
  alerts: Alert[];
  onItemNavigate?: () => void;
}) {
  if (alerts.length === 0) {
    return (
      <p className="px-3 py-8 text-center text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
        You have no notifications yet.
      </p>
    );
  }

  return (
    <ul className="py-0.5">
      {alerts.map((alert) => {
        const href = customerAlertHref(alert);

        return (
          <li
            key={alert.id}
            className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/80"
          >
            {href ? (
              <Link
                href={href}
                onClick={() => onItemNavigate?.()}
                className="block px-3 py-2.5 text-left transition hover:bg-zinc-100/90 dark:hover:bg-zinc-900/80"
              >
                <CustomerAlertRowBody alert={alert} />
              </Link>
            ) : (
              <div className="px-3 py-2.5">
                <CustomerAlertRowBody alert={alert} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
