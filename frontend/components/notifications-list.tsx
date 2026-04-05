"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  Building2,
  Clock,
  FileUp,
  Info,
  Mail,
  MessageSquareReply,
  RefreshCw,
  ScrollText,
  UserCheck,
  Users,
} from "lucide-react";
import { formatTimestamp } from "@/utils/datetime";
import type { Alert } from "@/types/database";

type IconConfig = { Icon: LucideIcon; className: string };

function alertTypeIconConfig(alertType: string): IconConfig {
  switch (alertType) {
    case "SHIPMENT_DELAYED":
      return { Icon: Clock, className: "text-amber-600 dark:text-amber-400" };
    case "STATUS_EXCEPTION":
      return { Icon: AlertTriangle, className: "text-red-600 dark:text-red-400" };
    case "INFO":
      return { Icon: Info, className: "text-zinc-500 dark:text-zinc-400" };
    case "ASSIGNMENT_ASSIGNEE":
      return { Icon: UserCheck, className: "text-violet-600 dark:text-violet-400" };
    case "ASSIGNMENT_PARTICIPANT":
      return { Icon: Users, className: "text-indigo-600 dark:text-indigo-400" };
    case "MESSAGE_NEW":
      return { Icon: Mail, className: "text-sky-600 dark:text-sky-400" };
    case "MESSAGE_REPLY":
      return { Icon: MessageSquareReply, className: "text-cyan-600 dark:text-cyan-400" };
    case "DOCUMENT_UPLOADED":
      return { Icon: FileUp, className: "text-emerald-600 dark:text-emerald-400" };
    case "ORG_INVITE_ACCEPTED":
      return { Icon: BadgeCheck, className: "text-green-600 dark:text-green-400" };
    case "CUSTOMER_JOINED_ORG":
      return { Icon: Building2, className: "text-teal-600 dark:text-teal-400" };
    case "BOL_IMPORTED":
      return { Icon: ScrollText, className: "text-orange-600 dark:text-orange-400" };
    case "TRACKING_SYNC_OK":
      return { Icon: RefreshCw, className: "text-blue-600 dark:text-blue-400" };
    default:
      return { Icon: Bell, className: "text-zinc-500 dark:text-zinc-400" };
  }
}

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
      <div cl>
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
