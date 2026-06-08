import type { ShipmentMessageThreadSummary } from "@/types/workspace-load";
import { formatShortTimestamp } from "@/utils/datetime";
import { stripMessageMarkup } from "@/utils/message-markup";
import {
  MESSAGE_PREVIEW_MAX_LEN,
  MESSAGES_LIST_ORDER_FALLBACK,
  MESSAGES_LIST_ROW_NEEDS_REPLY_CLASS,
  MESSAGES_LIST_ROW_READ_CLASS,
  MESSAGES_LIST_ROW_UNREAD_CLASS,
  MESSAGES_LIST_ROW_UNREAD_NEEDS_REPLY_CLASS,
} from "./constants";

export function truncateMessagePreview(body: string, maxLen = MESSAGE_PREVIEW_MAX_LEN): string {
  const trimmed = stripMessageMarkup(body).trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1)}…`;
}

export function threadNeedsReply(lastAuthorKind: string): boolean {
  return lastAuthorKind === "customer";
}

export function customerThreadNeedsReply(lastAuthorKind: string): boolean {
  return lastAuthorKind !== "customer";
}

export function threadAuthorTitle(thread: {
  last_author_name: string;
}): string {
  const name = thread.last_author_name?.trim();
  return name || "Unknown";
}

export function customerThreadAuthorTitle(thread: {
  last_author_kind: string;
  last_author_name: string;
}): string {
  if (thread.last_author_kind === "customer") {
    return "You";
  }
  const name = thread.last_author_name?.trim();
  return name || "Logistics Team";
}

export function threadAuthorEmail(thread: {
  last_author_kind: string;
  last_author_email: string | null;
}): string | null {
  if (thread.last_author_kind !== "customer") return null;
  const email = thread.last_author_email?.trim();
  return email || null;
}

export function formatMessageListTimestamp(iso: string, nowMs = Date.now()): string {
  return formatShortTimestamp(iso, nowMs);
}

export function threadOrderSubtitle(orderNumber: string | null, shipmentId: string): string {
  const trimmed = orderNumber?.trim();
  if (trimmed) return `Order No. ${trimmed}`;
  return `${MESSAGES_LIST_ORDER_FALLBACK} ${shipmentId.slice(0, 8)}`;
}

export function customerThreadOrderSubtitle(thread: ShipmentMessageThreadSummary): string {
  const org = thread.organization_name?.trim();
  const order = threadOrderSubtitle(thread.order_number, thread.shipment_id);
  return org ? `${org} · ${order}` : order;
}

export function threadHref(shipmentId: string): string {
  return `/shipments/${shipmentId}?tab=messages`;
}

export function customerThreadHref(shipmentId: string): string {
  return `/shipments/hub/${shipmentId}?tab=messages`;
}

export function threadRowLinkClass(isUnread: boolean, needsReply: boolean): string {
  if (isUnread && needsReply) return MESSAGES_LIST_ROW_UNREAD_NEEDS_REPLY_CLASS;
  if (isUnread) return MESSAGES_LIST_ROW_UNREAD_CLASS;
  if (needsReply) return MESSAGES_LIST_ROW_NEEDS_REPLY_CLASS;
  return MESSAGES_LIST_ROW_READ_CLASS;
}
