import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

/** `shipment_participants` — creator participation on new shipment / request. */
export async function insertShipmentParticipant(
  client: SupabaseClient,
  shipmentId: string,
  userId: string,
) {
  return client.from("shipment_participants").insert({ shipment_id: shipmentId, user_id: userId });
}
