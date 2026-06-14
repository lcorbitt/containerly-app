import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export type ShipmentMessageThreadReadUpsert = {
  organization_id: string;
  user_id: string;
  shipment_id: string;
  last_read_at: string;
  updated_at: string;
};

/** `shipment_message_thread_reads` — mark thread read cursor for a viewer. */
export async function upsertShipmentMessageThreadRead(
  client: SupabaseClient,
  row: ShipmentMessageThreadReadUpsert,
) {
  return client.from("shipment_message_thread_reads").upsert(row, {
    onConflict: "user_id,shipment_id",
  });
}

/** `shipment_message_thread_reads` — read cursors for org thread index. */
export function listShipmentMessageThreadReadsForUser(
  client: SupabaseClient,
  organizationId: string,
  userId: string,
  shipmentIds: string[],
) {
  return client
    .from("shipment_message_thread_reads")
    .select("shipment_id, last_read_at")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .in("shipment_id", shipmentIds);
}

/** `shipment_message_thread_reads` — read cursors for importer thread index. */
export function listImporterShipmentMessageThreadReadsForUser(
  client: SupabaseClient,
  userId: string,
  shipmentIds: string[],
) {
  return client
    .from("shipment_message_thread_reads")
    .select("shipment_id, last_read_at")
    .eq("user_id", userId)
    .in("shipment_id", shipmentIds);
}
