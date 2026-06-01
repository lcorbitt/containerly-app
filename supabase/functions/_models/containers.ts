import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

/** `containers` — upsert by org + normalized number (tracking request flow). */
export async function upsertContainerForTrackingRequest(
  client: SupabaseClient,
  row: {
    organization_id: string;
    shipment_id: string;
    container_number: string;
    normalized_number: string;
  },
) {
  return client
    .from("containers")
    .upsert(row, { onConflict: "organization_id,normalized_number" })
    .select("id")
    .single();
}

/** `containers` — by id in org (sync-container resolve number). */
export async function fetchContainerNumberById(
  client: SupabaseClient,
  organizationId: string,
  containerId: string,
) {
  return client
    .from("containers")
    .select("container_number")
    .eq("organization_id", organizationId)
    .eq("id", containerId)
    .maybeSingle();
}

/** `containers` — full row for get-container-details. */
export async function fetchContainerByIdInOrg(
  client: SupabaseClient,
  organizationId: string,
  containerId: string,
) {
  return client
    .from("containers")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", containerId)
    .maybeSingle();
}

/** `containers` — existing row for sync-by-number. */
export async function fetchContainerByNormalizedNumber(
  client: SupabaseClient,
  organizationId: string,
  normalizedNumber: string,
) {
  return client
    .from("containers")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("normalized_number", normalizedNumber)
    .maybeSingle();
}

export async function upsertContainerFromProvider(
  client: SupabaseClient,
  payload: Record<string, unknown>,
) {
  return client
    .from("containers")
    .upsert(payload, { onConflict: "organization_id,normalized_number" })
    .select()
    .single();
}

export async function updateContainerEnrichment(
  client: SupabaseClient,
  containerId: string,
  enrichment: Record<string, unknown>,
) {
  return client.from("containers").update({ enrichment }).eq("id", containerId);
}

export async function updateContainerLastCheckedAt(
  client: SupabaseClient,
  containerId: string,
  at: string,
) {
  return client.from("containers").update({ last_checked_at: at }).eq("id", containerId);
}

/** `containers` — portal: all units on shipment. */
export async function listContainersForShipment(
  client: SupabaseClient,
  shipmentId: string,
) {
  return client
    .from("containers")
    .select(
      "id, container_number, normalized_number, carrier, status, location, enrichment, last_synced_at, last_checked_at, raw_external",
    )
    .eq("shipment_id", shipmentId)
    .order("container_number", { ascending: true });
}

/** `containers` — customer message: validate container belongs to shipment. */
export async function fetchContainerIdAndShipmentId(
  client: SupabaseClient,
  containerId: string,
) {
  return client.from("containers").select("id, shipment_id").eq("id", containerId).maybeSingle();
}

/** `containers` — resolve shipment from container id (sync). */
export async function fetchContainerShipmentId(
  client: SupabaseClient,
  containerId: string,
  organizationId: string,
) {
  return client
    .from("containers")
    .select("shipment_id")
    .eq("id", containerId)
    .eq("organization_id", organizationId)
    .maybeSingle();
}

/** `containers` — workspace search. */
export async function searchContainersInOrg(
  client: SupabaseClient,
  organizationId: string,
  ilikePattern: string,
  normalizedPattern: string,
) {
  return client
    .from("containers")
    .select("id, container_number, normalized_number, carrier, status, last_synced_at")
    .eq("organization_id", organizationId)
    .or(`container_number.ilike.%${ilikePattern}%,normalized_number.ilike.%${normalizedPattern}%`)
    .limit(25);
}
