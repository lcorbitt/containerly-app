"use client";

import Link from "next/link";
import { formatTimestamp } from "@/utils/datetime";
import type { Alert } from "@/types/database";
import {
  useAcknowledgeAlertMutation,
  useResolveCustomerAccessRequestMutation,
} from "@/hooks/mutations/useAlerts";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { useToast } from "@/contexts/toast";
import { alertTypeIconConfig } from "@/utils/alert-display";

function alertHref(alert: Alert): string | null {
  if (alert.shipment_id) return `/shipments/${alert.shipment_id}`;
  if (alert.container_id) return `/containers/${alert.container_id}`;
  return null;
}

function accessRequestIdFromAlert(alert: Alert): string | null {
  const id = alert.details?.access_request_id;
  return typeof id === "string" ? id : null;
}

function accessRequestDecisionFromAlert(alert: Alert): "approved" | "denied" | null {
  const decision = alert.details?.access_request_status;
  return decision === "approved" || decision === "denied" ? decision : null;
}

function AlertRowBody({
  alert: a,
  onApproveAccess,
  onDenyAccess,
  resolvingAccess,
}: {
  alert: Alert;
  onApproveAccess?: () => void;
  onDenyAccess?: () => void;
  resolvingAccess?: boolean;
}) {
  const { Icon, className: iconColor } = alertTypeIconConfig(a.alert_type);
  const unacked = !a.acknowledged_at;
  const accessDecision = accessRequestDecisionFromAlert(a);
  const isAccessRequest = a.alert_type === "CUSTOMER_ACCESS_REQUESTED" && !accessDecision;

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
          {a.message}
        </p>
        {unacked ? (
          <span
            className="mt-0.5 h-2 w-2 shrink-0 self-start rounded-full bg-blue-500 dark:bg-blue-400"
            aria-label="Unread"
          />
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <p className="mt-1.5 text-[10px] text-zinc-400 dark:text-zinc-500">
            <span>{formatTimestamp(a.created_at)}</span>
          </p>
          {accessDecision ? (
            <span
              className={`mt-1 inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                accessDecision === "approved"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200"
                  : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {accessDecision === "approved" ? "Approved" : "Denied"}
            </span>
          ) : null}
        </div>
        {isAccessRequest && onApproveAccess && onDenyAccess ? (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={resolvingAccess}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onApproveAccess();
              }}
              className="flex-1 rounded-md bg-zinc-900 px-2 py-1 text-[10px] font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Approve
            </button>
            <button
              type="button"
              disabled={resolvingAccess}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDenyAccess();
              }}
              className="flex-1 rounded-md border border-zinc-200 px-2 py-1 text-[10px] font-medium text-zinc-700 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300"
            >
              Deny
            </button>
          </div>
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
  const { toast } = useToast();
  const { selectedOrgId } = useOrganizationWorkspace();
  const acknowledgeMut = useAcknowledgeAlertMutation(selectedOrgId);
  const resolveMut = useResolveCustomerAccessRequestMutation(selectedOrgId);

  async function handleResolve(alert: Alert, action: "approve" | "deny") {
    const requestId = accessRequestIdFromAlert(alert);
    if (!requestId) return;
    const r = await resolveMut.mutateAsync({ accessRequestId: requestId, action });
    if (!r.ok) {
      toast(r.error, "error");
      return;
    }
    toast(action === "approve" ? "Access approved." : "Request denied.", "success");
    if (!alert.acknowledged_at) {
      acknowledgeMut.mutate(alert.id);
    }
  }

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
        const unacked = !a.acknowledged_at;
        const cardBg = unacked
          ? "bg-blue-50/70 hover:bg-blue-100/70 dark:bg-blue-950/25 dark:hover:bg-blue-950/40"
          : "hover:bg-zinc-100/90 dark:hover:bg-zinc-900/80";
        const requestId = accessRequestIdFromAlert(a);
        const rowProps = {
          alert: a,
          onApproveAccess:
            a.alert_type === "CUSTOMER_ACCESS_REQUESTED" && requestId
              ? () => void handleResolve(a, "approve")
              : undefined,
          onDenyAccess:
            a.alert_type === "CUSTOMER_ACCESS_REQUESTED" && requestId
              ? () => void handleResolve(a, "deny")
              : undefined,
          resolvingAccess: resolveMut.isPending && resolveMut.variables?.accessRequestId === requestId,
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
                className={`block px-3 py-2.5 text-left transition ${cardBg}`}
              >
                <AlertRowBody {...rowProps} />
              </Link>
            ) : (
              <div className={`px-3 py-2.5 ${cardBg}`}>
                <AlertRowBody {...rowProps} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
