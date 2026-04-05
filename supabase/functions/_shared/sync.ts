import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { buildContainerEnrichment } from "./containerEnrichment.ts";
import { getJsoncargoConfig } from "./jsoncargoClient.ts";
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
  admin: SupabaseClient | null,
  organizationId: string,
  containerNumber: string,
  opts: {
    trackingRequestId?: string;
    forceRefresh?: boolean;
    /** Parent shipment for new container rows (containers.shipment_id). */
    shipmentId?: string | null;
    /** JSONCargo `shipping_line` query param (from shipment or env fallback in provider). */
    shippingLine?: string | null;
  },
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

  let effectiveShipmentId: string | null =
    typeof opts.shipmentId === "string" && opts.shipmentId.trim()
      ? opts.shipmentId.trim()
      : null;
  if (!effectiveShipmentId && existing?.shipment_id) {
    effectiveShipmentId = existing.shipment_id as string;
  }
  if (!effectiveShipmentId && opts.trackingRequestId) {
    const { data: trRow } = await userClient
      .from("tracking_requests")
      .select("container_id")
      .eq("id", opts.trackingRequestId)
      .eq("organization_id", organizationId)
      .maybeSingle();
    const cid = trRow?.container_id as string | null | undefined;
    if (cid) {
      const { data: cRow } = await userClient
        .from("containers")
        .select("shipment_id")
        .eq("id", cid)
        .eq("organization_id", organizationId)
        .maybeSingle();
      if (cRow?.shipment_id) effectiveShipmentId = cRow.shipment_id as string;
    }
  }
  if (!existing && !effectiveShipmentId) {
    throw new Error(
      "Cannot register a new container without a shipment context (create a tracking request from the dashboard first).",
    );
  }

  const stale =
    opts.forceRefresh ||
    !existing?.last_synced_at ||
    Date.now() - new Date(existing.last_synced_at as string).getTime() > STALE_MS;

  if (stale) {
    data = await fetchLiveFromProvider(normalized, { shippingLine: opts.shippingLine });
    refreshed = true;
    const upsertPayload: Record<string, unknown> = {
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
    if (effectiveShipmentId) {
      upsertPayload.shipment_id = effectiveShipmentId;
    }

    const { data: upserted, error: upErr } = await userClient
      .from("containers")
      .upsert(upsertPayload, { onConflict: "organization_id,normalized_number" })
      .select()
      .single();

    if (upErr) throw upErr;

    const jc = getJsoncargoConfig();
    if (jc) {
      try {
        const enrichment = await buildContainerEnrichment(jc.baseUrl, jc.apiKey, data.location);
        await userClient.from("containers").update({ enrichment }).eq("id", upserted.id as string);
      } catch {
        /* enrichment is best-effort */
      }
    }

    await logExternalCall(admin, {
      organization_id: organizationId,
      function_name: "sync-container",
      endpoint: "externalProvider",
      request_payload: { normalized, shipping_line: opts.shippingLine ?? null },
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

/** Loads `shipments.shipping_line` via tracking_request → container → shipment. */
export async function resolveShippingLineForTrackingRequest(
  userClient: SupabaseClient,
  organizationId: string,
  trackingRequestId: string,
): Promise<string | null> {
  const { data: tr, error } = await userClient
    .from("tracking_requests")
    .select("containers(shipments(shipping_line))")
    .eq("id", trackingRequestId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error || !tr) return null;
  const row = tr as {
    containers:
      | { shipments?: { shipping_line?: string | null } | { shipping_line?: string | null }[] | null }
      | { shipments?: { shipping_line?: string | null } | { shipping_line?: string | null }[] | null }[]
      | null;
  };
  const cont = Array.isArray(row.containers) ? row.containers[0] : row.containers;
  const rel = cont?.shipments;
  const ship = Array.isArray(rel) ? rel[0] : rel;
  const sl = ship?.shipping_line;
  return typeof sl === "string" && sl.trim() ? sl.trim() : null;
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
