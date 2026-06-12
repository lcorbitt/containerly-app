export const MESSAGE_ACTIVITY_PREVIEW_MAX_LEN = 120;

export function truncateMessageActivityPreview(
  body: string,
  maxLen = MESSAGE_ACTIVITY_PREVIEW_MAX_LEN,
): string {
  const trimmed = body.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1)}…`;
}

export function messageActivityEventType(authorKind: string): "customer_message" | "operator_message" {
  return authorKind === "customer" ? "customer_message" : "operator_message";
}

export function messageActivityActorKind(authorKind: string): "customer" | "operator" {
  return authorKind === "customer" ? "customer" : "operator";
}

export function resolveMessageActivityDisplayName(
  authorDisplayName: string | null | undefined,
  authorKind: string,
): string {
  const trimmed = authorDisplayName?.trim();
  if (trimmed) return trimmed;
  return authorKind === "customer" ? "Customer" : "Team member";
}

export function resolveMessageActivityBody(body: string, attachmentCount = 0): string {
  const trimmed = body.trim();
  if (trimmed) return trimmed;
  if (attachmentCount > 0) {
    return attachmentCount === 1 ? "Sent an attachment" : `Sent ${attachmentCount} attachments`;
  }
  return "Message posted";
}

export function messageActivityCommunicationTitle(authorDisplayName: string): string {
  const name = authorDisplayName.trim() || "Unknown sender";
  return `Message from ${name}`;
}

export function formatCommunicationTimelinePreview(
  body: string,
  maxLen = MESSAGE_ACTIVITY_PREVIEW_MAX_LEN,
): string {
  const truncated = truncateMessageActivityPreview(body, maxLen);
  if (!truncated) return "";
  return `"${truncated}"`;
}

export function buildMessageActivityMetadata(input: {
  messageId: string;
  authorKind: string;
  authorDisplayName: string | null | undefined;
  body: string;
  containerId?: string | null;
  attachmentCount?: number;
}): Record<string, unknown> {
  const activityBody = resolveMessageActivityBody(input.body, input.attachmentCount ?? 0);
  return {
    message_id: input.messageId,
    author_display_name: resolveMessageActivityDisplayName(input.authorDisplayName, input.authorKind),
    message_preview: truncateMessageActivityPreview(activityBody),
    container_id: input.containerId ?? null,
    scope: input.containerId ? "container" : "shipment",
  };
}
