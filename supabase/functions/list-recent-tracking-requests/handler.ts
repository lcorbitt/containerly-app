import { requireAuthUserId } from "@services/auth.ts";
import { createUserClient } from "@services/db.ts";
import { fetchRecentTrackingRequestsForOrganizationQuery } from "@services/tracking/dashboard.service.ts";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@services/utils.ts";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const url = new URL(req.url);
    const organizationId = url.searchParams.get("organization_id")?.trim() ?? "";
    const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") ?? 50) || 50));

    if (!organizationId || !UUID_RE.test(organizationId)) {
      return jsonResponse({ error: "Invalid organization_id" }, { status: 400 });
    }

    const userClient = createUserClient(req);
    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;

    const requests = await fetchRecentTrackingRequestsForOrganizationQuery(
      userClient,
      organizationId,
      limit,
    );
    return jsonResponse({ requests });
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 500 });
  }
}
