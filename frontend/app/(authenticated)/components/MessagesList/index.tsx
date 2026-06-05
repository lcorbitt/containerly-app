"use client";

import Link from "next/link";
import type { ShipmentMessageThreadSummary } from "@/types/workspace-load";
import {
  MESSAGES_LIST_AUTHOR_BADGE_BASE_CLASS,
  MESSAGES_LIST_AUTHOR_BADGE_CUSTOMER_CLASS,
  MESSAGES_LIST_AUTHOR_BADGE_TEAM_CLASS,
  MESSAGES_LIST_AUTHOR_EMAIL_CLASS,
  MESSAGES_LIST_AUTHOR_NAME_CLASS,
  MESSAGES_LIST_AUTHOR_META_CLASS,
  MESSAGES_LIST_AUTHOR_NAME_NEEDS_REPLY_CLASS,
  MESSAGES_LIST_AUTHOR_SECTION_CLASS,
  MESSAGES_LIST_CLASS,
  MESSAGES_LIST_EMPTY_HINT,
  MESSAGES_LIST_EMPTY_TITLE,
  MESSAGES_LIST_ORDER_TITLE_CLASS,
  MESSAGES_LIST_PREVIEW_EMPTY_CLASS,
  MESSAGES_LIST_PREVIEW_SHELL_CLASS,
  MESSAGES_LIST_PREVIEW_SHELL_NEEDS_REPLY_CLASS,
  MESSAGES_LIST_PREVIEW_TEXT_CLASS,
  MESSAGES_LIST_PREVIEW_TEXT_NEEDS_REPLY_CLASS,
  MESSAGES_LIST_ROW_LINK_CLASS,
  MESSAGES_LIST_ROW_NEEDS_REPLY_CLASS,
  MESSAGES_LIST_TIMESTAMP_CLASS,
} from "./constants";
import {
  formatMessageListTimestamp,
  threadAuthorEmail,
  threadAuthorRoleLabel,
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
  const orderTitle = threadOrderSubtitle(thread.order_number, thread.shipment_id);
  const roleLabel = threadAuthorRoleLabel(thread.last_author_kind);
  const isCustomer = thread.last_author_kind === "customer";

  return (
    <article className="min-w-0">
      <header className="flex items-start justify-between gap-2">
        <h3
          className={MESSAGES_LIST_ORDER_TITLE_CLASS}
          title={orderTitle}
        >
          {orderTitle}
        </h3>
        <time
          dateTime={thread.last_message_at}
          className={MESSAGES_LIST_TIMESTAMP_CLASS}
        >
          {formatMessageListTimestamp(thread.last_message_at)}
        </time>
      </header>

      <div className={MESSAGES_LIST_AUTHOR_SECTION_CLASS}>
        <span
          className={`${MESSAGES_LIST_AUTHOR_BADGE_BASE_CLASS} ${
            isCustomer
              ? MESSAGES_LIST_AUTHOR_BADGE_CUSTOMER_CLASS
              : MESSAGES_LIST_AUTHOR_BADGE_TEAM_CLASS
          }`}
        >
          {roleLabel}
        </span>
        <div className={MESSAGES_LIST_AUTHOR_META_CLASS}>
          <p
            className={
              needsReply
                ? MESSAGES_LIST_AUTHOR_NAME_NEEDS_REPLY_CLASS
                : MESSAGES_LIST_AUTHOR_NAME_CLASS
            }
            title={authorTitle}
          >
            {authorTitle}
          </p>
          {authorEmail ? (
            <p className={MESSAGES_LIST_AUTHOR_EMAIL_CLASS} title={authorEmail}>
              {authorEmail}
            </p>
          ) : null}
        </div>
      </div>

      <div
        className={
          needsReply
            ? MESSAGES_LIST_PREVIEW_SHELL_NEEDS_REPLY_CLASS
            : MESSAGES_LIST_PREVIEW_SHELL_CLASS
        }
      >
        {preview ? (
          <p
            className={
              needsReply
                ? MESSAGES_LIST_PREVIEW_TEXT_NEEDS_REPLY_CLASS
                : MESSAGES_LIST_PREVIEW_TEXT_CLASS
            }
          >
            {preview}
          </p>
        ) : (
          <p className={MESSAGES_LIST_PREVIEW_EMPTY_CLASS}>No message text</p>
        )}
      </div>
    </article>
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
    <ul className={MESSAGES_LIST_CLASS}>
      {threads.map((thread) => {
        const needsReply = threadNeedsReply(thread.last_author_kind);
        return (
          <li key={thread.shipment_id}>
            <Link
              href={threadHref(thread.shipment_id)}
              onClick={() => onItemNavigate?.()}
              className={`${MESSAGES_LIST_ROW_LINK_CLASS}${
                needsReply ? ` ${MESSAGES_LIST_ROW_NEEDS_REPLY_CLASS}` : ""
              }`}
            >
              <ThreadRowBody thread={thread} />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
