import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { createServiceClient, createUserClient } from "../_shared/supabase.ts";
import { normalizeContainerNumber } from "../_shared/normalize.ts";
import { syncContainerByNumber } from "../_shared/sync.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userClient = createUserClient(req);
    const admin = createServiceClient();
    const body = (await req.json()) as {
      organization_id?: string;
      container_number?: string;
      container_id?: string;
      tracking_request_id?: string;
      force?: boolean;
    };

    if (!body.organization_id) {
      return jsonResponse({ error: "organization_id required" }, { status: 400 });
    }

    let number = body.container_number;
    if (!number && body.container_id) {
      const { data: row, error } = await userClient
        .from("containers")
        .select("container_number")
        .eq("organization_id", body.organization_id)
        .eq("id", body.container_id)
        .maybeSingle();
      if (error) throw error;
      if (!row) return jsonResponse({ error: "Container not found" }, { status: 404 });
      number = row.container_number as string;
    }

    if (!number) {
      return jsonResponse(
        { error: "container_number or container_id required" },
        { status: 400 },
      );
    }

    if (body.tracking_request_id) {
      const { data: tr, error: trErr } = await userClient
        .from("tracking_requests")
        .select("id, normalized_number")
        .eq("organization_id", body.organization_id)
        .eq("id", body.tracking_request_id)
        .maybeSingle();
      if (trErr) throw trErr;
      if (!tr) {
        return jsonResponse({ error: "Tracking request not found" }, { status: 404 });
      }
      const trNorm = tr.normalized_number as string;
      if (normalizeContainerNumber(number) !== trNorm) {
        return jsonResponse(
          { error: "Container number does not match tracking request" },
          { status: 400 },
        );
      }
    }

    const result = await syncContainerByNumber(
      userClient,
      admin,
      body.organization_id,
      number,
      {
        trackingRequestId: body.tracking_request_id,
        forceRefresh: Boolean(body.force),
      },
    );

    return jsonResponse({
      container: result.container,
      refreshed: result.refreshed,
      provider: result.data,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse({ error: message }, { status: 500 });
  }
});
