import { requireAuthUser, requireAuthUserId } from "@services/auth";
import { createUserClient } from "@services/db";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@services/utils";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

import { loadContainerWorkspaceDataForUser } from "@services/workspace/workspace.service";

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "GET") return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  try {
    const url = new URL(req.url);
    const organizationId = url.searchParams.get("organization_id")?.trim() ?? "";
    const containerId = url.searchParams.get("container_id")?.trim() ?? "";
    if (!UUID_RE.test(organizationId) || !UUID_RE.test(containerId)) {
      return jsonResponse({ error: "Invalid organization_id or container_id" }, { status: 400 });
    }
    const userClient = createUserClient(req);
    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;
    const result = await loadContainerWorkspaceDataForUser(userClient, { containerId, organizationId });
    if (!result.ok) return jsonResponse(result, { status: 400 });
    return jsonResponse(result);
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    return jsonResponse({ error: message }, { status: 500 });
  }
}
