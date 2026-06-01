import { MESSAGE_PREVIEW_MAX_LEN, MESSAGES_LIST_ORDER_FALLBACK } from "./constants";

export function truncateMessagePreview(body: string, maxLen = MESSAGE_PREVIEW_MAX_LEN): string {
  const trimmed = body.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1)}…`;
}

export function threadNeedsReply(lastAuthorKind: string): boolean {
  return lastAuthorKind === "customer";
}

export function threadOrderLabel(orderNumber: string | null, shipmentId: string): string {
  const trimmed = orderNumber?.trim();
  if (trimmed) return trimmed;
  return `${MESSAGES_LIST_ORDER_FALLBACK} ${shipmentId.slice(0, 8)}`;
}

export function threadHref(shipmentId: string): string {
  return `/shipments/${shipmentId}?tab=messages`;
}
