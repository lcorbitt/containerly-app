import { createUserClient } from "@services/db";
import { jsonResponse } from "@services/utils";
import { searchContainers } from "@services/tracking/tracking.service";

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userClient = createUserClient(req);
    const body = (await req.json()) as { organization_id?: string; q?: string };

    const result = await searchContainers(
      userClient,
      body.organization_id ?? "",
      body.q ?? "",
    );

    if (!result.ok) {
      return jsonResponse({ error: result.error }, { status: result.status });
    }
    return jsonResponse({ results: result.results });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse({ error: message }, { status: 500 });
  }
}
