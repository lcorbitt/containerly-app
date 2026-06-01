import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

/** `tracking_events` — latest event for deduping on sync. */
export async function fetchLatestTrackingEventForRequest(
  client: SupabaseClient,
  trackingRequestId: string,
) {
  return client
    .from("tracking_events")
    .select("id, status, occurred_at")
    .eq("tracking_request_id", trackingRequestId)
    .order("occurred_at", { ascending: false })
    .limit(1)
    .maybeSingle();
}

/** `tracking_events` — insert after provider sync. */
export async function insertTrackingEvent(client: SupabaseClient, row: Record<string, unknown>) {
  return client.from("tracking_events").insert(row);
}

/** `tracking_events` — portal timeline. */
export async function listTrackingEventsForContainers(
  client: SupabaseClient,
  containerIds: string[],
  limit = 500,
) {
  if (containerIds.length === 0) {
    return { data: [] as Record<string, unknown>[], error: null };
  }
  return client
    .from("tracking_events")
    .select("id, event_type, status, location, occurred_at, container_id")
    .in("container_id", containerIds)
    .order("occurred_at", { ascending: true })
    .limit(limit);
}
