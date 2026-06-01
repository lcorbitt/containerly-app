"use client";

import Link from "next/link";
import { formatTimestamp } from "@/utils/datetime";
import type { ShipmentMessageThreadSummary } from "@/types/workspace-load";
import {
  MESSAGES_LIST_EMPTY_HINT,
  MESSAGES_LIST_EMPTY_TITLE,
  MESSAGES_LIST_ROW_LINK_CLASS,
} from "./constants";
import { threadHref, threadNeedsReply, threadOrderLabel, truncateMessagePreview } from "./utils";

function ThreadRowBody({ thread }: { thread: ShipmentMessageThreadSummary }) {
  const needsReply = threadNeedsReply(thread.last_author_kind);
  const preview = truncateMessagePreview(thread.last_message_preview);

  return (
    <>
      <p
        className={`min-w-0 line-clamp-1 text-xs font-bold leading-snug wrap-break-word ${
          needsReply ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-800 dark:text-zinc-200"
        }`}
      >
        {threadOrderLabel(thread.order_number, thread.shipment_id)}
      </p>
      {preview ? (
        <p
          className={`mt-1 min-w-0 line-clamp-2 text-[11px] leading-snug wrap-break-word ${
            needsReply ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-600 dark:text-zinc-400"
          }`}
        >
          {preview}
        </p>
      ) : null}
      <p className="mt-1.5 text-[10px] text-zinc-400 dark:text-zinc-500">
        <span>{formatTimestamp(thread.last_message_at)}</span>
      </p>
    </>
  );
}

export function MessagesList({
  threads,
  onItemNavigate,
}: {
  threads: ShipmentMessageThreadSummary[];
  onItemNavigate?: () => void;
}) {
  if (threads.length === 0) {
    return (
      <div className="px-3 py-8 text-center">
        <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{MESSAGES_LIST_EMPTY_TITLE}</p>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          {MESSAGES_LIST_EMPTY_HINT}
        </p>
      </div>
    );
  }

  return (
    <ul className="py-0.5">
      {threads.map((thread) => (
        <li
          key={thread.shipment_id}
          className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/80"
        >
          <Link
            href={threadHref(thread.shipment_id)}
            onClick={() => onItemNavigate?.()}
            className={MESSAGES_LIST_ROW_LINK_CLASS}
          >
            <ThreadRowBody thread={thread} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
