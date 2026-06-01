import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

/** `shipment_participants` — creator participation on new shipment / request. */
export async function insertShipmentParticipant(
  client: SupabaseClient,
  shipmentId: string,
  userId: string,
) {
  return client.from("shipment_participants").insert({ shipment_id: shipmentId, user_id: userId });
}

export async function listShipmentParticipantsUserIds(client: SupabaseClient, shipmentId: string) {
  return client
    .from("shipment_participants")
    .select("user_id")
    .eq("shipment_id", shipmentId);
}

/** Whether `userId` is a row on `shipment_participants` for this shipment. */
export async function fetchShipmentParticipantForUser(
  client: SupabaseClient,
  shipmentId: string,
  userId: string,
) {
  return client
    .from("shipment_participants")
    .select("id")
    .eq("shipment_id", shipmentId)
    .eq("user_id", userId)
    .maybeSingle();
}
