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
              ? "font-semibold text-zinc-900 dark:text-zinc-50"
              : "font-normal text-zinc-600 dark:text-zinc-400"
          }`}
        >
          {alert.message}
        </p>
        {unacked ? (
          <span
            className="mt-0.5 h-2 w-2 shrink-0 self-start rounded-full bg-blue-500 dark:bg-blue-400"
            aria-label="Unread"
          />
        ) : null}
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
        const unacked = !alert.acknowledged_at;
        const cardBg = unacked
          ? "bg-blue-50/70 hover:bg-blue-100/70 dark:bg-blue-950/25 dark:hover:bg-blue-950/40"
          : "hover:bg-zinc-100/90 dark:hover:bg-zinc-900/80";

        return (
          <li
            key={alert.id}
            className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/80"
          >
            {href ? (
              <Link
                href={href}
                onClick={() => onItemNavigate?.()}
                className={`block px-3 py-2.5 text-left transition ${cardBg}`}
              >
                <CustomerAlertRowBody alert={alert} />
              </Link>
            ) : (
              <div className={`px-3 py-2.5 ${cardBg}`}>
                <CustomerAlertRowBody alert={alert} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
