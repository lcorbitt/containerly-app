import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { insertAlert } from "@models/alerts.ts";
import { buildContainerEnrichment } from "@supabase-shared/providers/jsoncargo/enrichment.ts";
import { getJsoncargoConfig } from "@supabase-shared/providers/jsoncargo/client.ts";
import { fetchLiveFromProvider, type NormalizedContainer } from "@supabase-shared/providers/jsoncargo/container-tracking.ts";
import {
  fetchContainerByNormalizedNumber,
  fetchContainerShipmentId,
  upsertContainerFromProvider,
  updateContainerEnrichment,
  updateContainerLastCheckedAt,
} from "@models/containers.ts";
import { logExternalCall } from "@supabase-shared/logger.ts";
import {
  fetchLatestTrackingEventForRequest,
  insertTrackingEvent,
} from "@models/tracking_events.ts";
import {
  fetchTrackingRequestContainerId,
  fetchTrackingRequestWithShipmentLine,
  listTrackingRequestsDueForSync,
  updateTrackingRequestStatus,
} from "@models/tracking_requests.ts";
import { normalizeContainerNumber } from "@supabase-shared/container-number.ts";

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

  const { data: existing, error: loadErr } = await fetchContainerByNormalizedNumber(
    userClient,
    organizationId,
    normalized,
  );

  if (loadErr) throw loadErr;

  let effectiveShipmentId: string | null =
    typeof opts.shipmentId === "string" && opts.shipmentId.trim()
      ? opts.shipmentId.trim()
      : null;
  if (!effectiveShipmentId && existing?.shipment_id) {
    effectiveShipmentId = existing.shipment_id as string;
  }
  if (!effectiveShipmentId && opts.trackingRequestId) {
    const { data: trRow } = await fetchTrackingRequestContainerId(
      userClient,
      organizationId,
      opts.trackingRequestId,
    );
    const cid = trRow?.container_id as string | null | undefined;
    if (cid) {
      const { data: cRow } = await fetchContainerShipmentId(userClient, cid, organizationId);
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

    const { data: upserted, error: upErr } = await upsertContainerFromProvider(userClient, upsertPayload);

    if (upErr) throw upErr;
    if (!upserted) throw new Error("upsertContainerFromProvider returned no row");

    const jc = getJsoncargoConfig();
    if (jc) {
      try {
        const enrichment = await buildContainerEnrichment(jc.baseUrl, jc.apiKey, data.location);
        await updateContainerEnrichment(userClient, upserted.id as string, enrichment);
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

  await updateContainerLastCheckedAt(userClient, existing.id as string, new Date().toISOString());

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
  const { data: tr, error } = await fetchTrackingRequestWithShipmentLine(
    userClient,
    organizationId,
    trackingRequestId,
  );
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

  const { data: recent } = await fetchLatestTrackingEventForRequest(userClient, trackingRequestId);

  await updateTrackingRequestStatus(userClient, trackingRequestId, {
    container_id: containerId,
    status: "active",
    last_sync_at: new Date().toISOString(),
    next_check_at: new Date(Date.now() + TRACKING_NEXT_CHECK_MS).toISOString(),
    error_message: null,
  });

  const changed =
    !recent ||
    (recent.status as string) !== primaryEvent.status ||
    (recent.occurred_at as string) !== primaryEvent.occurred_at;

  if (changed) {
    await insertTrackingEvent(userClient, {
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
    await insertAlert(userClient, {
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

// ---------------------------------------------------------------------------
// Cron: sync stale tracking requests (admin client)
// ---------------------------------------------------------------------------

export type SyncStaleResult = {
  id: string;
  ok: boolean;
  error?: string;
};

export async function syncStaleRequests(
  admin: SupabaseClient,
): Promise<{ processed: number; results: SyncStaleResult[] }> {
  const nowIso = new Date().toISOString();
  const limit = Math.min(100, Number(Deno.env.get("SYNC_BATCH_LIMIT") ?? 25));

  const { data: batch, error } = await listTrackingRequestsDueForSync(admin, nowIso, limit);

  if (error) throw error;

  const results: SyncStaleResult[] = [];

  for (const row of batch ?? []) {
    try {
      const cont = (row as {
        containers?:
          | {
              shipment_id?: string | null;
              shipments?: { shipping_line?: string | null } | { shipping_line?: string | null }[] | null;
            }
          | {
              shipment_id?: string | null;
              shipments?: { shipping_line?: string | null } | { shipping_line?: string | null }[] | null;
            }[]
          | null;
      }).containers;
      const c = Array.isArray(cont) ? cont[0] : cont;
      const shipmentId = typeof c?.shipment_id === "string" ? c.shipment_id : null;
      const rel = c?.shipments;
      const ship = Array.isArray(rel) ? rel[0] : rel;
      const sl = ship?.shipping_line;
      const shippingLine = typeof sl === "string" && sl.trim() ? sl.trim() : null;

      await syncContainerByNumber(admin, admin, row.organization_id as string, row.container_number as string, {
        trackingRequestId: row.id as string,
        shipmentId,
        forceRefresh: false,
        shippingLine,
      });
      results.push({ id: row.id as string, ok: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "error";
      await updateTrackingRequestStatus(admin, row.id as string, {
        status: "failed",
        error_message: msg,
        next_check_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      });
      results.push({ id: row.id as string, ok: false, error: msg });
    }
  }

  return { processed: results.length, results };
}
