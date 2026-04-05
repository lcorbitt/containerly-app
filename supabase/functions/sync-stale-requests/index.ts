import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { syncContainerByNumber } from "../_shared/sync.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST" && req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  const cronSecret = Deno.env.get("CRON_SECRET");
  const headerSecret = req.headers.get("x-cron-secret");
  if (!cronSecret || headerSecret !== cronSecret) {
    return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createServiceClient();
    const nowIso = new Date().toISOString();
    const limit = Math.min(
      100,
      Number(Deno.env.get("SYNC_BATCH_LIMIT") ?? 25),
    );

    const { data: batch, error } = await admin
      .from("tracking_requests")
      .select(
        "id, organization_id, container_number, status, container_id, containers(shipment_id, shipments(shipping_line))",
      )
      .in("status", ["pending", "syncing", "active"])
      .lte("next_check_at", nowIso)
      .order("next_check_at", { ascending: true })
      .limit(limit);

    if (error) throw error;

    const results: Array<{ id: string; ok: boolean; error?: string }> = [];

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
        await syncContainerByNumber(
          admin,
          admin,
          row.organization_id as string,
          row.container_number as string,
          {
            trackingRequestId: row.id as string,
            shipmentId,
            forceRefresh: false,
            shippingLine,
          },
        );
        results.push({ id: row.id as string, ok: true });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "error";
        await admin
          .from("tracking_requests")
          .update({
            status: "failed",
            error_message: msg,
            next_check_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          })
          .eq("id", row.id as string);
        results.push({ id: row.id as string, ok: false, error: msg });
      }
    }

    return jsonResponse({
      processed: results.length,
      results,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse({ error: message }, { status: 500 });
  }
});
