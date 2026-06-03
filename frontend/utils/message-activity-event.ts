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
  authorDisplayName: string;
  body: string;
  containerId?: string | null;
}): Record<string, unknown> {
  return {
    message_id: input.messageId,
    author_display_name: input.authorDisplayName.trim() || "Unknown sender",
    message_preview: truncateMessageActivityPreview(input.body),
    container_id: input.containerId ?? null,
    scope: input.containerId ? "container" : "shipment",
  };
}
