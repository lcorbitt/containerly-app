import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export async function insertShipmentCustomerAccessRequest(
  client: SupabaseClient,
  row: Record<string, unknown>,
) {
  return client
    .from("shipment_customer_access_requests")
    .insert(row)
    .select("id")
    .single();
}

export async function fetchPendingAccessRequestByEmailForShipment(
  client: SupabaseClient,
  shipmentId: string,
  email: string,
) {
  return client
    .from("shipment_customer_access_requests")
    .select("id")
    .eq("shipment_id", shipmentId)
    .eq("requester_email", email.trim().toLowerCase())
    .eq("status", "pending")
    .maybeSingle();
}

export async function fetchAccessRequestById(client: SupabaseClient, requestId: string) {
  return client.from("shipment_customer_access_requests").select("*").eq("id", requestId).maybeSingle();
}

export async function updateAccessRequest(
  client: SupabaseClient,
  requestId: string,
  fields: Record<string, unknown>,
) {
  return client.from("shipment_customer_access_requests").update(fields).eq("id", requestId);
}

export async function listPendingAccessRequestsForShipment(
  client: SupabaseClient,
  shipmentId: string,
) {
  return client
    .from("shipment_customer_access_requests")
    .select("id, requester_email, requested_at, status")
    .eq("shipment_id", shipmentId)
    .eq("status", "pending")
    .order("requested_at", { ascending: false });
}
