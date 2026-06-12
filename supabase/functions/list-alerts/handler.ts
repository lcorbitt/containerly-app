import { requireAuthUserId } from "@services/auth.ts";
import { fetchAlertsPage } from "@services/alert/alert.service.ts";
import { createUserClient } from "@services/db.ts";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@services/utils.ts";

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const url = new URL(req.url);
    const scopeRaw = url.searchParams.get("scope")?.trim() ?? "";
    const scope = scopeRaw === "me" ? "me" : scopeRaw === "org" ? "org" : null;
    if (!scope) {
      return jsonResponse({ error: "scope must be org or me" }, { status: 400 });
    }

    const limit = Number(url.searchParams.get("limit") ?? 50) || 50;
    const organizationId = url.searchParams.get("organization_id")?.trim() ?? undefined;

    const userClient = createUserClient(req);
    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;

    const result = await fetchAlertsPage(userClient, auth.userId, {
      scope,
      organizationId,
      limit,
    });

    if (!result.ok) {
      return jsonResponse({ error: result.error }, { status: result.status });
    }
    return jsonResponse({ alerts: result.alerts });
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 500 });
  }
}
