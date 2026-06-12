import { createUserClient, tryCreateServiceClient } from "@services/db.ts";
import { jsonResponse } from "@services/utils.ts";
import { getContainerDetails } from "@services/tracking/tracking.service.ts";

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userClient = createUserClient(req);
    const admin = tryCreateServiceClient();
    const url = new URL(req.url);

    const result = await getContainerDetails(userClient, admin, {
      organization_id: url.searchParams.get("organization_id") ?? "",
      container_id: url.searchParams.get("container_id") ?? undefined,
      number: url.searchParams.get("number") ?? undefined,
      force: url.searchParams.get("force") === "1",
    });

    if (!result.ok) {
      return jsonResponse({ error: result.error }, { status: result.status });
    }
    return jsonResponse({
      container: result.container,
      refreshed: result.refreshed,
      ...(result.normalized ? { normalized: result.normalized } : {}),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse({ error: message }, { status: 500 });
  }
}
