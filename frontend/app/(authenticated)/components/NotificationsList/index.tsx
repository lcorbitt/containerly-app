"use client";

import Link from "next/link";
import { formatTimestamp } from "@/utils/datetime";
import type { Alert } from "@/types/database";
import { alertTypeIconConfig } from "./utils";

function AlertRowBody({ alert: a }: { alert: Alert }) {
  const { Icon, className: iconColor } = alertTypeIconConfig(a.alert_type);

  return (
    <>
      <div className="flex min-h-[2.75rem] items-center gap-2">
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center"
          aria-hidden
        >
          <Icon className={`h-4 w-4 ${iconColor}`} strokeWidth={2} />
        </span>
        <p className="min-w-0 flex-1 line-clamp-4 text-xs leading-snug wrap-break-word text-zinc-800 dark:text-zinc-200">
          {a.message}
        </p>
      </div>
      <div className="flex items-center justify-end gap-2">
        <p className="mt-1.5 text-[10px] text-zinc-400 dark:text-zinc-500">
          <span>{formatTimestamp(a.created_at)}</span>
        </p>
      </div>
    </>
  );
}

export function NotificationsList({
  alerts,
  onItemNavigate,
}: {
  alerts: Alert[];
  onItemNavigate?: () => void;
}) {
  if (alerts.length === 0) {
    return (
      <p className="px-3 py-8 text-center text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
        No notifications for this workspace.
      </p>
    );
  }

  return (
    <ul className="py-0.5">
      {alerts.map((a) => (
        <li
          key={a.id}
          className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/80"
        >
          {a.container_id ? (
            <Link
              href={`/containers/${a.container_id}`}
              onClick={() => onItemNavigate?.()}
              className="block px-3 py-2.5 text-left transition hover:bg-zinc-100/90 dark:hover:bg-zinc-900/80"
            >
              <AlertRowBody alert={a} />
            </Link>
          ) : (
            <div className="px-3 py-2.5">
              <AlertRowBody alert={a} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
