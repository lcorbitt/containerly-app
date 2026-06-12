import { createServiceClient } from "@services/db";
import { jsonResponse } from "@services/utils";
import { syncStaleRequests } from "@services/tracking/sync";

export async function handle(req: Request): Promise<Response> {
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
}
