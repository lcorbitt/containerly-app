"use client";

import Link from "next/link";
import type { ShipmentMessageThreadSummary } from "@/types/workspace-load";
import {
  MESSAGES_LIST_EMPTY_HINT,
  MESSAGES_LIST_EMPTY_TITLE,
  MESSAGES_LIST_ROW_LINK_CLASS,
} from "./constants";
import {
  formatMessageListTimestamp,
  threadAuthorEmail,
  threadAuthorTitle,
  threadHref,
  threadNeedsReply,
  threadOrderSubtitle,
  truncateMessagePreview,
} from "./utils";

function ThreadRowBody({ thread }: { thread: ShipmentMessageThreadSummary }) {
  const needsReply = threadNeedsReply(thread.last_author_kind);
  const preview = truncateMessagePreview(thread.last_message_preview);
  const authorTitle = threadAuthorTitle(thread);
  const authorEmail = threadAuthorEmail(thread);
  const authorNameClass = needsReply
    ? "text-zinc-900 dark:text-zinc-100"
    : "text-zinc-800 dark:text-zinc-200";

  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p
            className={`min-w-0 truncate text-xs font-bold leading-snug ${authorNameClass}`}
            title={authorTitle}
          >
            {authorTitle}
          </p>
          {authorEmail ? (
            <p
              className="mt-0.5 min-w-0 truncate text-[11px] leading-snug text-zinc-500 dark:text-zinc-400"
              title={authorEmail}
            >
              {authorEmail}
            </p>
          ) : null}
        </div>
        <time
          dateTime={thread.last_message_at}
          className="shrink-0 text-[10px] tabular-nums leading-snug text-zinc-400 dark:text-zinc-500"
        >
          {formatMessageListTimestamp(thread.last_message_at)}
        </time>
      </div>
      <p
        className={`mt-0.5 min-w-0 line-clamp-1 text-[11px] font-medium leading-snug wrap-break-word ${
          needsReply ? "text-zinc-600 dark:text-zinc-400" : "text-zinc-500 dark:text-zinc-500"
        }`}
      >
        {threadOrderSubtitle(thread.order_number, thread.shipment_id)}
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
