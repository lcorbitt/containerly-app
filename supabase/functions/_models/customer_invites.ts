import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

/** `customer_invites` — create pending invite. */
export async function insertCustomerInvite(client: SupabaseClient, row: Record<string, unknown>) {
  return client
    .from("customer_invites")
    .insert(row)
    .select("id, expires_at, created_at")
    .single();
}

export async function fetchCustomerInviteByTokenHash(client: SupabaseClient, tokenHash: string) {
  return client.from("customer_invites").select("*").eq("token_hash", tokenHash).maybeSingle();
}

export async function fetchPendingInviteByEmailForShipment(
  client: SupabaseClient,
  shipmentId: string,
  email: string,
) {
  return client
    .from("customer_invites")
    .select("*")
    .eq("shipment_id", shipmentId)
    .eq("invited_email", email.trim().toLowerCase())
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
}

export async function updateCustomerInviteStatus(
  client: SupabaseClient,
  id: string,
  fields: Record<string, unknown>,
) {
  return client.from("customer_invites").update(fields).eq("id", id);
}
