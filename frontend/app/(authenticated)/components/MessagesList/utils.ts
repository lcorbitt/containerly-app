import { formatShortTimestamp } from "@/utils/datetime";
import { stripMessageMarkup } from "@/utils/message-markup";
import { MESSAGE_PREVIEW_MAX_LEN, MESSAGES_LIST_ORDER_FALLBACK } from "./constants";

export function truncateMessagePreview(body: string, maxLen = MESSAGE_PREVIEW_MAX_LEN): string {
  const trimmed = stripMessageMarkup(body).trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1)}…`;
}

export function threadNeedsReply(lastAuthorKind: string): boolean {
  return lastAuthorKind === "customer";
}

export function threadAuthorTitle(thread: {
  last_author_name: string;
}): string {
  const name = thread.last_author_name?.trim();
  return name || "Unknown";
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

export function threadHref(shipmentId: string): string {
  return `/shipments/${shipmentId}?tab=messages`;
}
