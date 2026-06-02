import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { insertShipmentActivityEvent } from "@models/shipment_activity_events.ts";

const MESSAGE_PREVIEW_MAX_LEN = 120;

function truncatePreview(body: string): string {
  const trimmed = body.trim();
  if (trimmed.length <= MESSAGE_PREVIEW_MAX_LEN) return trimmed;
  return `${trimmed.slice(0, MESSAGE_PREVIEW_MAX_LEN - 1)}…`;
}

/** Persist a shipment timeline entry for a customer-visible message. */
export async function recordMessageActivityEvent(
  client: SupabaseClient,
  input: {
    shipmentId: string;
    messageId: string;
    body: string;
    authorKind: string;
    authorDisplayName: string;
    authorUserId: string | null;
    containerId?: string | null;
  },
): Promise<void> {
  const isCustomer = input.authorKind === "customer";
  const displayName = input.authorDisplayName.trim() || (isCustomer ? "Customer" : "Team member");

  const { error } = await insertShipmentActivityEvent(client, {
    shipment_id: input.shipmentId,
    event_type: isCustomer ? "customer_message" : "operator_message",
    body: input.body.trim(),
    actor_kind: isCustomer ? "customer" : "operator",
    actor_user_id: input.authorUserId,
    metadata: {
      message_id: input.messageId,
      author_display_name: displayName,
      message_preview: truncatePreview(input.body),
      container_id: input.containerId ?? null,
      scope: input.containerId ? "container" : "shipment",
    },
  });

  if (error) throw error;
}
