"use client";

import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatTimestamp } from "@/utils/datetime";
import type { Alert } from "@/types/database";
import { acknowledgeAlert } from "@/services/alert.service";
import { orgAlertsQueryKeyRoot } from "@/hooks/queries/useAlert";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { alertTypeIconConfig } from "./utils";

function alertHref(alert: Alert): string | null {
  if (alert.shipment_id) return `/shipments/${alert.shipment_id}`;
  if (alert.container_id) return `/containers/${alert.container_id}`;
  return null;
}

function AlertRowBody({
  alert: a,
  onAcknowledge,
  acknowledging,
}: {
  alert: Alert;
  onAcknowledge?: () => void;
  acknowledging?: boolean;
}) {
  const { Icon, className: iconColor } = alertTypeIconConfig(a.alert_type);
  const unacked = !a.acknowledged_at;

  return (
    <>
      <div className="flex min-h-[2.75rem] items-center gap-2">
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
          {a.message}
        </p>
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="mt-1.5 text-[10px] text-zinc-400 dark:text-zinc-500">
          <span>{formatTimestamp(a.created_at)}</span>
        </p>
        {unacked && onAcknowledge ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAcknowledge();
            }}
            disabled={acknowledging}
            className="mt-1 shrink-0 text-[10px] font-medium text-zinc-600 underline hover:text-zinc-900 disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            {acknowledging ? "Saving…" : "Dismiss"}
          </button>
        ) : null}
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
  const { selectedOrgId } = useOrganizationWorkspace();
  const qc = useQueryClient();
  const acknowledgeMut = useMutation({
    mutationFn: acknowledgeAlert,
    onSuccess: () => {
      if (selectedOrgId) {
        void qc.invalidateQueries({ queryKey: [...orgAlertsQueryKeyRoot, selectedOrgId] });
      }
    },
  });

  if (alerts.length === 0) {
    return (
      <p className="px-3 py-8 text-center text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
        No notifications for this workspace.
      </p>
    );
  }

  return (
    <ul className="py-0.5">
      {alerts.map((a) => {
        const href = alertHref(a);
        const rowProps = {
          alert: a,
          onAcknowledge: !a.acknowledged_at
            ? () => acknowledgeMut.mutate(a.id)
            : undefined,
          acknowledging: acknowledgeMut.isPending && acknowledgeMut.variables === a.id,
        };

        return (
          <li
            key={a.id}
            className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/80"
          >
            {href ? (
              <Link
                href={href}
                onClick={() => onItemNavigate?.()}
                className="block px-3 py-2.5 text-left transition hover:bg-zinc-100/90 dark:hover:bg-zinc-900/80"
              >
                <AlertRowBody {...rowProps} />
              </Link>
            ) : (
              <div className="px-3 py-2.5">
                <AlertRowBody {...rowProps} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
