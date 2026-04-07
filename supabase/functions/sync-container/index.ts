import { corsHeaders, jsonResponse } from "../_shared/infra/cors.ts";
import { createUserClient, tryCreateServiceClient } from "../_shared/infra/supabase.ts";
import { syncContainer } from "../_shared/domain/tracking/tracking.service.ts";
import type { SyncContainerBody } from "@shared/dto/tracking.dto.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userClient = createUserClient(req);
    const admin = tryCreateServiceClient();
    const body = (await req.json()) as SyncContainerBody;

    const result = await syncContainer(userClient, admin, body);

    if (!result.ok) {
      return jsonResponse({ error: result.error }, { status: result.status });
    }
    return jsonResponse({
      container: result.container,
      refreshed: result.refreshed,
      provider: result.provider,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse({ error: message }, { status: 500 });
  }
});
