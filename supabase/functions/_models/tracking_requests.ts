import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

/** `tracking_requests` — create row. */
export async function insertTrackingRequest(client: SupabaseClient, row: Record<string, unknown>) {
  return client.from("tracking_requests").insert(row).select().single();
}

export async function updateTrackingRequestStatus(
  client: SupabaseClient,
  id: string,
  fields: Record<string, unknown>,
) {
  return client.from("tracking_requests").update(fields).eq("id", id);
}

export async function fetchTrackingRequestById(client: SupabaseClient, id: string) {
  return client.from("tracking_requests").select("*").eq("id", id).single();
}

export async function fetchTrackingRequestNormalizedById(
  client: SupabaseClient,
  organizationId: string,
  id: string,
) {
  return client
    .from("tracking_requests")
    .select("id, normalized_number")
    .eq("organization_id", organizationId)
    .eq("id", id)
    .maybeSingle();
}

/** Join container → shipment for shipping_line resolution. */
export async function fetchTrackingRequestWithShipmentLine(
  client: SupabaseClient,
  organizationId: string,
  id: string,
) {
  return client
    .from("tracking_requests")
    .select("containers(shipments(shipping_line))")
    .eq("organization_id", organizationId)
    .eq("id", id)
    .maybeSingle();
}

export async function fetchTrackingRequestContainerId(
  client: SupabaseClient,
  organizationId: string,
  id: string,
) {
  return client
    .from("tracking_requests")
    .select("container_id")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();
}

export async function fetchTrackingRequestWithContainerShipment(
  client: SupabaseClient,
  organizationId: string,
  id: string,
) {
  return client
    .from("tracking_requests")
    .select("containers(shipment_id)")
    .eq("organization_id", organizationId)
    .eq("id", id)
    .maybeSingle();
}

/** `tracking_requests` — portal: workflow row per container. */
export async function listTrackingRequestsByContainerIds(
  client: SupabaseClient,
  containerIds: string[],
) {
  if (containerIds.length === 0) {
    return { data: [] as Record<string, unknown>[], error: null };
  }
  return client
    .from("tracking_requests")
    .select("id, status, container_id, last_sync_at")
    .in("container_id", containerIds);
}

/** Cron: due rows with nested container/shipment for shipping line. */
export async function listTrackingRequestsDueForSync(
  client: SupabaseClient,
  beforeIso: string,
  limit: number,
) {
  return client
    .from("tracking_requests")
    .select(
      "id, organization_id, container_number, status, container_id, containers(shipment_id, shipments(shipping_line))",
    )
    .in("status", ["pending", "syncing", "active"])
    .lte("next_check_at", beforeIso)
    .order("next_check_at", { ascending: true })
    .limit(limit);
}
