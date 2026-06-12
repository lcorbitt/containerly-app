import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { insertShipmentActivityEvent } from "@models/shipment_activity_events";

const MESSAGE_PREVIEW_MAX_LEN = 120;

function truncatePreview(body: string): string {
  const trimmed = body.trim();
  if (trimmed.length <= MESSAGE_PREVIEW_MAX_LEN) return trimmed;
  return `${trimmed.slice(0, MESSAGE_PREVIEW_MAX_LEN - 1)}…`;
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

/** Persist a shipment timeline entry for a customer-visible message. */
export async function recordMessageActivityEvent(
  client: SupabaseClient,
  input: {
    shipmentId: string;
    messageId: string;
    body: string;
    authorKind: string;
    authorDisplayName?: string | null;
    authorUserId: string | null;
    containerId?: string | null;
    attachmentCount?: number;
  },
): Promise<void> {
  const isCustomer = input.authorKind === "customer";
  const displayName = resolveMessageActivityDisplayName(input.authorDisplayName, input.authorKind);
  const activityBody = resolveMessageActivityBody(input.body, input.attachmentCount ?? 0);

  const { error } = await insertShipmentActivityEvent(client, {
    shipment_id: input.shipmentId,
    report_message_id: input.messageId,
    event_type: isCustomer ? "customer_message" : "operator_message",
    body: activityBody,
    actor_kind: isCustomer ? "customer" : "operator",
    actor_user_id: input.authorUserId,
    metadata: {
      message_id: input.messageId,
      author_display_name: displayName,
      message_preview: truncatePreview(activityBody),
      container_id: input.containerId ?? null,
      scope: input.containerId ? "container" : "shipment",
    },
  });

  if (error) throw error;
}
