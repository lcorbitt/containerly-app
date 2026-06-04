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

/**
 * Auto-resolve any still-`pending` access requests for an email on a shipment to `approved`.
 * Called when access is granted through the other path (operator invite / invite-claim) so a
 * request and an invite can't both sit open for the same `(shipment, email)` — they converge on
 * one entitlement, matching how GitHub/Google/Slack reconcile "request to join" vs "invite".
 */
export async function approvePendingAccessRequestsForEmail(
  client: SupabaseClient,
  shipmentId: string,
  email: string,
  fields: {
    invite_id?: string | null;
    access_id?: string | null;
    resolved_by_user_id?: string | null;
  },
) {
  const patch: Record<string, unknown> = {
    status: "approved",
    resolved_at: new Date().toISOString(),
    resolved_by_user_id: fields.resolved_by_user_id ?? null,
  };
  if (fields.invite_id !== undefined) patch.invite_id = fields.invite_id;
  if (fields.access_id !== undefined) patch.access_id = fields.access_id;

  return client
    .from("shipment_customer_access_requests")
    .update(patch)
    .eq("shipment_id", shipmentId)
    .eq("requester_email", email.trim().toLowerCase())
    .eq("status", "pending");
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
