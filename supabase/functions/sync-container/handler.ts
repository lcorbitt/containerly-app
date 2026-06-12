import { createUserClient, tryCreateServiceClient } from "@services/db";
import { jsonResponse } from "@services/utils";
import { syncContainer } from "@services/tracking/tracking.service";
import type { SyncContainerBody } from "@shared/dto/tracking.dto";

export async function handle(req: Request): Promise<Response> {
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
}
