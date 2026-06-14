import { requireAuthUser, requireAuthUserId } from "@services/auth.ts";
import { createUserClient } from "@services/db.ts";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@services/utils.ts";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

import { listImporterShipmentMessageThreads } from "@services/workspace/workspace.service.ts";

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "GET") return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  try {
    const userClient = createUserClient(req);
    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;
    const result = await listImporterShipmentMessageThreads(userClient, auth.userId);
    if (!result.ok) return jsonResponse(result, { status: 400 });
    return jsonResponse(result);
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    return jsonResponse({ error: message }, { status: 500 });
  }
}
