import { corsHeaders, jsonResponse } from "../_shared/infra/cors.ts";
import { createServiceClient } from "../_shared/infra/supabase.ts";
import { syncStaleRequests } from "../_shared/domain/tracking/cron.service.ts";

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
    const result = await syncStaleRequests(admin);
    return jsonResponse(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse({ error: message }, { status: 500 });
  }
});
