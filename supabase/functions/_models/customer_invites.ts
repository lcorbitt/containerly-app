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

/**
 * Latest invite for an email on a shipment that still entitles access — `pending`
 * or `accepted`, ignoring the 7-day expiry (the operator deliberately invited them).
 * Excludes `revoked`/`expired` so cancelled invites cannot grant access.
 */
export async function fetchInviteByEmailForShipment(
  client: SupabaseClient,
  shipmentId: string,
  email: string,
) {
  return client
    .from("customer_invites")
    .select("*")
    .eq("shipment_id", shipmentId)
    .eq("invited_email", email.trim().toLowerCase())
    .in("status", ["pending", "accepted"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
}

export async function updateCustomerInviteStatus(
  client: SupabaseClient,
  id: string,
  fields: Record<string, unknown>,
) {
  return client.from("customer_invites").update(fields).eq("id", id);
}
