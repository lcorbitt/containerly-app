import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { fetchLiveFromProvider, NormalizedContainer } from "./externalProvider.ts";
import { normalizeContainerNumber } from "./normalize.ts";
import { logExternalCall } from "./logger.ts";

const STALE_MS = Number(Deno.env.get("CONTAINER_STALE_MS") ?? 15 * 60 * 1000);

/** After a successful sync with a tracking request, when cron should reconsider this row (default 1h). Lower in dev to test cron. */
const TRACKING_NEXT_CHECK_MS = Number(
  Deno.env.get("TRACKING_NEXT_CHECK_MS") ?? 60 * 60 * 1000,
);

export async function syncContainerByNumber(
  userClient: SupabaseClient,
  admin: SupabaseClient,
  organizationId: string,
  containerNumber: string,
  opts: { trackingRequestId?: string; forceRefresh?: boolean },
): Promise<{ container: Record<string, unknown>; refreshed: boolean; data: NormalizedContainer }> {
  const normalized = normalizeContainerNumber(containerNumber);
  const started = performance.now();

  let data: NormalizedContainer;
  let refreshed = false;

  const { data: existing, error: loadErr } = await userClient
    .from("containers")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("normalized_number", normalized)
    .maybeSingle();

  if (loadErr) throw loadErr;

  const stale =
    opts.forceRefresh ||
    !existing?.last_synced_at ||
    Date.now() - new Date(existing.last_synced_at as string).getTime() > STALE_MS;

  if (stale) {
    data = await fetchLiveFromProvider(normalized);
    refreshed = true;
    const upsertPayload = {
      organization_id: organizationId,
      container_number: data.container_number,
      normalized_number: normalized,
      carrier: data.carrier,
      status: data.status,
      location: data.location,
      raw_external: data.raw,
      last_synced_at: new Date().toISOString(),
      last_checked_at: new Date().toISOString(),
    };

    const { data: upserted, error: upErr } = await userClient
      .from("containers")
      .upsert(upsertPayload, { onConflict: "organization_id,normalized_number" })
      .select()
      .single();

    if (upErr) throw upErr;

    await logExternalCall(admin, {
      organization_id: organizationId,
      function_name: "sync-container",
      endpoint: "externalProvider",
      request_payload: { normalized },
      response_status: 200,
      response_body: { refreshed: true },
      duration_ms: Math.round(performance.now() - started),
    });

    if (opts.trackingRequestId) {
      await appendEventsAndAlerts(
        userClient,
        organizationId,
        opts.trackingRequestId,
        upserted.id as string,
        data,
      );
    }

    return { container: upserted, refreshed, data };
  }

  await userClient
    .from("containers")
    .update({ last_checked_at: new Date().toISOString() })
    .eq("id", existing.id);

  data = {
    container_number: existing.container_number as string,
    carrier: existing.carrier as string | null,
    status: (existing.status as string) ?? "UNKNOWN",
    location: (existing.location as Record<string, unknown>) ?? null,
    occurred_at: (existing.last_synced_at as string) ?? new Date().toISOString(),
    events: [],
    raw: (existing.raw_external as Record<string, unknown>) ?? {},
  };

  await logExternalCall(admin, {
    organization_id: organizationId,
    function_name: "sync-container",
    endpoint: "cache-hit",
    request_payload: { normalized },
    response_status: 200,
    response_body: { refreshed: false },
    duration_ms: Math.round(performance.now() - started),
  });

  return { container: existing as Record<string, unknown>, refreshed: false, data };
}

async function appendEventsAndAlerts(
  userClient: SupabaseClient,
  organizationId: string,
  trackingRequestId: string,
  containerId: string,
  data: NormalizedContainer,
): Promise<void> {
  const primaryEvent = data.events[0] ?? {
    event_type: "SYNC",
    status: data.status,
    location: data.location,
    occurred_at: data.occurred_at,
  };

  const { data: recent } = await userClient
    .from("tracking_events")
    .select("id, status, occurred_at")
    .eq("tracking_request_id", trackingRequestId)
    .order("occurred_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  await userClient
    .from("tracking_requests")
    .update({
      container_id: containerId,
      status: "active",
      last_sync_at: new Date().toISOString(),
      next_check_at: new Date(Date.now() + TRACKING_NEXT_CHECK_MS).toISOString(),
      error_message: null,
    })
    .eq("id", trackingRequestId);

  const changed =
    !recent ||
    (recent.status as string) !== primaryEvent.status ||
    (recent.occurred_at as string) !== primaryEvent.occurred_at;

  if (changed) {
    await userClient.from("tracking_events").insert({
      organization_id: organizationId,
      tracking_request_id: trackingRequestId,
      container_id: containerId,
      event_type: primaryEvent.event_type,
      status: primaryEvent.status,
      location: primaryEvent.location,
      occurred_at: primaryEvent.occurred_at,
      raw_payload: data.raw,
    });
  }

  const s = (data.status ?? "").toUpperCase();
  if (s.includes("DELAY") || s.includes("EXCEPTION")) {
    await userClient.from("alerts").insert({
      organization_id: organizationId,
      tracking_request_id: trackingRequestId,
      container_id: containerId,
      alert_type: s.includes("EXCEPTION") ? "STATUS_EXCEPTION" : "SHIPMENT_DELAYED",
      severity: s.includes("EXCEPTION") ? "critical" : "warning",
      message: `Container ${data.container_number} reported status: ${data.status}`,
      details: { status: data.status },
    });
  }
}
