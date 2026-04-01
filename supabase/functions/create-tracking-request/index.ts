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
      run_sync?: boolean;
    };

    if (!body.organization_id || !body.container_number?.trim()) {
      return jsonResponse(
        { error: "organization_id and container_number required" },
        { status: 400 },
      );
    }

    const normalized = normalizeContainerNumber(body.container_number);
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: inserted, error: insErr } = await userClient
      .from("tracking_requests")
      .insert({
        organization_id: body.organization_id,
        created_by: userData.user.id,
        container_number: body.container_number.trim(),
        normalized_number: normalized,
        status: "pending",
        next_check_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insErr) throw insErr;

    if (body.run_sync !== false) {
      await userClient
        .from("tracking_requests")
        .update({ status: "syncing" })
        .eq("id", inserted.id);

      try {
        await syncContainerByNumber(
          userClient,
          admin,
          body.organization_id,
          body.container_number.trim(),
          { trackingRequestId: inserted.id, forceRefresh: true },
        );
      } catch (syncErr) {
        await userClient
          .from("tracking_requests")
          .update({
            status: "failed",
            error_message: syncErr instanceof Error ? syncErr.message : "Sync failed",
          })
          .eq("id", inserted.id);
        throw syncErr;
      }
    }

    const { data: finalRow } = await userClient
      .from("tracking_requests")
      .select("*")
      .eq("id", inserted.id)
      .single();

    return jsonResponse({ tracking_request: finalRow ?? inserted });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse({ error: message }, { status: 500 });
  }
});
