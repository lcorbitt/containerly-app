import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

/** `shipment_customer_access` — active grant id only. */
export async function fetchActiveAccessId(
  client: SupabaseClient,
  shipmentId: string,
  customerUserId: string,
) {
  return client
    .from("shipment_customer_access")
    .select("id")
    .eq("shipment_id", shipmentId)
    .eq("customer_user_id", customerUserId)
    .is("revoked_at", null)
    .maybeSingle();
}

/** `shipment_customer_access` — full row for importer portal. */
export async function fetchActiveAccessFull(
  client: SupabaseClient,
  shipmentId: string,
  customerUserId: string,
) {
  return client
    .from("shipment_customer_access")
    .select("*")
    .eq("shipment_id", shipmentId)
    .eq("customer_user_id", customerUserId)
    .is("revoked_at", null)
    .maybeSingle();
}

export async function insertShipmentCustomerAccess(
  client: SupabaseClient,
  row: Record<string, unknown>,
) {
  return client.from("shipment_customer_access").insert(row).select("id").single();
}

export async function updateShipmentCustomerAccess(
  client: SupabaseClient,
  accessId: string,
  fields: Record<string, unknown>,
) {
  return client.from("shipment_customer_access").update(fields).eq("id", accessId);
}

/** `shipment_customer_access` — id + org for posting customer messages. */
export async function fetchAccessIdAndOrg(
  client: SupabaseClient,
  shipmentId: string,
  customerUserId: string,
) {
  return client
    .from("shipment_customer_access")
    .select("id, organization_id")
    .eq("shipment_id", shipmentId)
    .eq("customer_user_id", customerUserId)
    .is("revoked_at", null)
    .maybeSingle();
}

/** `shipment_customer_access` — setup completion (id only for user). */
export async function fetchAccessIdForUser(
  client: SupabaseClient,
  shipmentId: string,
  userId: string,
) {
  return client
    .from("shipment_customer_access")
    .select("id")
    .eq("shipment_id", shipmentId)
    .eq("customer_user_id", userId)
    .is("revoked_at", null)
    .maybeSingle();
}

export async function listActiveCustomerAccessForShipment(client: SupabaseClient, shipmentId: string) {
  return client
    .from("shipment_customer_access")
    .select("customer_user_id")
    .eq("shipment_id", shipmentId)
    .is("revoked_at", null);
}
