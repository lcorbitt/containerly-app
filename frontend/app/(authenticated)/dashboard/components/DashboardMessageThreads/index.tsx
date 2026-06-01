"use client";

import Link from "next/link";
import { Loader2, MessageSquare } from "lucide-react";
import { threadHref, threadNeedsReply, threadOrderLabel, truncateMessagePreview } from "@/app/(authenticated)/components/MessagesList/utils";
import { formatTimestamp } from "@/utils/datetime";
import {
  DASHBOARD_MESSAGE_THREADS_EMPTY_HINT,
  DASHBOARD_MESSAGE_THREADS_MAX,
  DASHBOARD_MESSAGE_THREADS_PANEL_CLASS,
  DASHBOARD_MESSAGE_THREADS_ROW_CLASS,
} from "./constants";
import type { DashboardMessageThreadsProps } from "./types";

export function DashboardMessageThreads({ threads, loading }: DashboardMessageThreadsProps) {
  const needsReply = threads.filter((t) => threadNeedsReply(t.last_author_kind)).slice(0, DASHBOARD_MESSAGE_THREADS_MAX);

  if (loading) {
    return (
      <section className={DASHBOARD_MESSAGE_THREADS_PANEL_CLASS} aria-busy="true">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Messages needing reply</h2>
        <div className="mt-6 flex min-h-32 items-center justify-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
          <span>Loading threads...</span>
        </div>
      </section>
    );
  }

  return (
    <section className={DASHBOARD_MESSAGE_THREADS_PANEL_CLASS}>
      <div className="mb-4 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-primary-orange" aria-hidden />
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Messages needing reply</h2>
      </div>

      {needsReply.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{DASHBOARD_MESSAGE_THREADS_EMPTY_HINT}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {needsReply.map((thread) => {
            const preview = truncateMessagePreview(thread.last_message_preview);
            return (
              <li key={thread.shipment_id}>
                <Link href={threadHref(thread.shipment_id)} className={DASHBOARD_MESSAGE_THREADS_ROW_CLASS}>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {threadOrderLabel(thread.order_number, thread.shipment_id)}
                  </p>
                  {preview ? (
                    <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-zinc-600 dark:text-zinc-400">
                      {preview}
                    </p>
                  ) : null}
                  <p className="mt-1.5 text-[10px] text-zinc-400 dark:text-zinc-500">
                    {formatTimestamp(thread.last_message_at)}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
