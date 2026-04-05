import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { createUserClient, tryCreateServiceClient } from "../_shared/supabase.ts";
import { normalizeContainerNumber } from "../_shared/normalize.ts";
import { syncContainerByNumber } from "../_shared/sync.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userClient = createUserClient(req);
    const admin = tryCreateServiceClient();
    const url = new URL(req.url);
    const organizationId = url.searchParams.get("organization_id");
    const containerId = url.searchParams.get("container_id");
    const number = url.searchParams.get("number");
    const force = url.searchParams.get("force") === "1";

    if (!organizationId || (!containerId && !number)) {
      return jsonResponse(
        { error: "organization_id and (container_id or number) required" },
        { status: 400 },
      );
    }

    if (number) {
      const result = await syncContainerByNumber(
        userClient,
        admin,
        organizationId,
        number,
        { forceRefresh: force },
      );
      return jsonResponse({
        container: result.container,
        refreshed: result.refreshed,
        normalized: normalizeContainerNumber(number),
      });
    }

    const { data: row, error } = await userClient
      .from("containers")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("id", containerId!)
      .maybeSingle();

    if (error) throw error;
    if (!row) {
      return jsonResponse({ error: "Not found" }, { status: 404 });
    }

    const stale =
      force ||
      !row.last_synced_at ||
      Date.now() - new Date(row.last_synced_at as string).getTime() >
        Number(Deno.env.get("CONTAINER_STALE_MS") ?? 15 * 60 * 1000);

    if (stale) {
      const result = await syncContainerByNumber(
        userClient,
        admin,
        organizationId,
        row.container_number as string,
        { forceRefresh: true },
      );
      return jsonResponse({
        container: result.container,
        refreshed: result.refreshed,
      });
    }

    return jsonResponse({ container: row, refreshed: false });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse({ error: message }, { status: 500 });
  }
});
