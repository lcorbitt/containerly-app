import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export type ShipmentActivityInsert = {
  shipment_id: string;
  shipment_message_id?: string | null;
  event_type: string;
  body: string;
  actor_kind?: string;
  actor_user_id?: string | null;
  metadata?: Record<string, unknown>;
  occurred_at?: string;
};

export async function listShipmentActivityEvents(client: SupabaseClient, shipmentId: string) {
  return client
    .from("shipment_activity_events")
    .select("id, event_type, body, actor_kind, occurred_at, metadata")
    .eq("shipment_id", shipmentId)
    .order("occurred_at", { ascending: true });
}

export async function insertShipmentActivityEvent(
  client: SupabaseClient,
  row: ShipmentActivityInsert,
) {
  return client.from("shipment_activity_events").insert({
    shipment_id: row.shipment_id,
    shipment_message_id: row.shipment_message_id ?? null,
    event_type: row.event_type,
    body: row.body,
    actor_kind: row.actor_kind ?? "system",
    actor_user_id: row.actor_user_id ?? null,
    metadata: row.metadata ?? {},
    occurred_at: row.occurred_at ?? new Date().toISOString(),
  }).select("id").single();
}

const MESSAGE_EVENT_TYPES = ["customer_message", "operator_message"] as const;

/** `shipment_activity_events` — timeline rows linked to a thread message. */
export async function listMessageActivityEventsForShipmentMessage(
  client: SupabaseClient,
  shipmentMessageId: string,
) {
  return client
    .from("shipment_activity_events")
    .select("id, metadata")
    .eq("shipment_message_id", shipmentMessageId)
    .in("event_type", [...MESSAGE_EVENT_TYPES]);
}

/** `shipment_activity_events` — sync body/preview after message edit. */
export async function updateShipmentActivityEventBody(
  client: SupabaseClient,
  eventId: string,
  body: string,
  metadata: Record<string, unknown>,
) {
  return client
    .from("shipment_activity_events")
    .update({ body, metadata })
    .eq("id", eventId);
}
