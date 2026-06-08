"use client";

import Link from "next/link";
import { useMarkShipmentThreadRead } from "@/hooks/mutations/useMarkShipmentThreadRead";
import { useMarkImporterShipmentThreadRead } from "@/hooks/mutations/useMarkImporterShipmentThreadRead";
import { useOrganizationWorkspaceOptional } from "@/contexts/organization-workspace";
import type { ShipmentMessageThreadSummary } from "@/types/workspace-load";
import {
  CUSTOMER_MESSAGES_LIST_EMPTY_HINT,
  MESSAGES_LIST_AUTHOR_EMAIL_CLASS,
  MESSAGES_LIST_AUTHOR_TITLE_READ_CLASS,
  MESSAGES_LIST_AUTHOR_TITLE_UNREAD_CLASS,
  MESSAGES_LIST_CLASS,
  MESSAGES_LIST_EMPTY_HINT,
  MESSAGES_LIST_EMPTY_TITLE,
  MESSAGES_LIST_ORDER_SUBTITLE_READ_CLASS,
  MESSAGES_LIST_ORDER_SUBTITLE_UNREAD_CLASS,
  MESSAGES_LIST_PREVIEW_EMPTY_CLASS,
  MESSAGES_LIST_PREVIEW_SHELL_CLASS,
  MESSAGES_LIST_PREVIEW_SHELL_NEEDS_REPLY_CLASS,
  MESSAGES_LIST_PREVIEW_TEXT_NEEDS_REPLY_READ_CLASS,
  MESSAGES_LIST_PREVIEW_TEXT_NEEDS_REPLY_UNREAD_CLASS,
  MESSAGES_LIST_PREVIEW_TEXT_READ_CLASS,
  MESSAGES_LIST_PREVIEW_TEXT_UNREAD_CLASS,
  MESSAGES_LIST_ROW_LINK_CLASS,
  MESSAGES_LIST_TIMESTAMP_READ_CLASS,
  MESSAGES_LIST_TIMESTAMP_UNREAD_CLASS,
} from "./constants";
import type { MessagesListProps, MessagesListViewer } from "./types";
import {
  customerThreadAuthorTitle,
  customerThreadHref,
  customerThreadNeedsReply,
  customerThreadOrderSubtitle,
  formatMessageListTimestamp,
  threadAuthorEmail,
  threadAuthorTitle,
  threadHref,
  threadNeedsReply,
  threadOrderSubtitle,
  threadRowLinkClass,
  truncateMessagePreview,
} from "./utils";

function resolveListBehavior(viewer: MessagesListViewer) {
  if (viewer === "customer") {
    return {
      emptyHint: CUSTOMER_MESSAGES_LIST_EMPTY_HINT,
      href: customerThreadHref,
      needsReply: customerThreadNeedsReply,
      authorTitle: customerThreadAuthorTitle,
      authorEmail: () => null,
      orderSubtitle: customerThreadOrderSubtitle,
    };
  }

  return {
    emptyHint: MESSAGES_LIST_EMPTY_HINT,
    href: threadHref,
    needsReply: threadNeedsReply,
    authorTitle: threadAuthorTitle,
    authorEmail: threadAuthorEmail,
    orderSubtitle: (thread: ShipmentMessageThreadSummary) =>
      threadOrderSubtitle(thread.order_number, thread.shipment_id),
  };
}

function ThreadRowBody({
  thread,
  viewer,
}: {
  thread: ShipmentMessageThreadSummary;
  viewer: MessagesListViewer;
}) {
  const behavior = resolveListBehavior(viewer);
  const isUnread = thread.is_unread;
  const needsReply = behavior.needsReply(thread.last_author_kind);
  const preview = truncateMessagePreview(thread.last_message_preview);
  const authorTitle = behavior.authorTitle(thread);
  const authorEmail = behavior.authorEmail(thread);
  const orderTitle = behavior.orderSubtitle(thread);

  return (
    <article className="min-w-0">
      <header className="flex items-start justify-between gap-2">
        <h3
          className={isUnread ? MESSAGES_LIST_AUTHOR_TITLE_UNREAD_CLASS : MESSAGES_LIST_AUTHOR_TITLE_READ_CLASS}
          title={authorTitle}
        >
          {authorTitle}
        </h3>
        <time
          dateTime={thread.last_message_at}
          className={isUnread ? MESSAGES_LIST_TIMESTAMP_UNREAD_CLASS : MESSAGES_LIST_TIMESTAMP_READ_CLASS}
        >
          {formatMessageListTimestamp(thread.last_message_at)}
        </time>
      </header>

      {authorEmail ? (
        <p className={MESSAGES_LIST_AUTHOR_EMAIL_CLASS} title={authorEmail}>
          {authorEmail}
        </p>
      ) : null}

      <p
        className={isUnread ? MESSAGES_LIST_ORDER_SUBTITLE_UNREAD_CLASS : MESSAGES_LIST_ORDER_SUBTITLE_READ_CLASS}
        title={orderTitle}
      >
        {orderTitle}
      </p>

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
                ? isUnread
                  ? MESSAGES_LIST_PREVIEW_TEXT_NEEDS_REPLY_UNREAD_CLASS
                  : MESSAGES_LIST_PREVIEW_TEXT_NEEDS_REPLY_READ_CLASS
                : isUnread
                  ? MESSAGES_LIST_PREVIEW_TEXT_UNREAD_CLASS
                  : MESSAGES_LIST_PREVIEW_TEXT_READ_CLASS
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
  viewer = "operator",
}: MessagesListProps) {
  const workspace = useOrganizationWorkspaceOptional();
  const selectedOrgId = workspace?.selectedOrgId ?? null;
  const operatorMarkReadMut = useMarkShipmentThreadRead(selectedOrgId);
  const customerMarkReadMut = useMarkImporterShipmentThreadRead();
  const behavior = resolveListBehavior(viewer);

  function handleThreadNavigate(thread: ShipmentMessageThreadSummary) {
    onItemNavigate?.();
    if (!thread.is_unread) return;

    if (viewer === "customer") {
      customerMarkReadMut.mutate({ shipmentId: thread.shipment_id });
      return;
    }

    if (selectedOrgId) {
      operatorMarkReadMut.mutate({ shipmentId: thread.shipment_id });
    }
  }

  if (threads.length === 0) {
    return (
      <div className="px-3 py-8 text-center">
        <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{MESSAGES_LIST_EMPTY_TITLE}</p>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          {behavior.emptyHint}
        </p>
      </div>
    );
  }

  return (
    <ul className={MESSAGES_LIST_CLASS}>
      {threads.map((thread) => {
        const needsReply = behavior.needsReply(thread.last_author_kind);
        return (
          <li key={thread.shipment_id}>
            <Link
              href={behavior.href(thread.shipment_id)}
              onClick={() => handleThreadNavigate(thread)}
              className={`${MESSAGES_LIST_ROW_LINK_CLASS} ${threadRowLinkClass(thread.is_unread, needsReply)}`}
            >
              <ThreadRowBody thread={thread} viewer={viewer} />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
