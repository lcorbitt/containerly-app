import { requireAuthUserId } from "@services/auth.ts";
import { acknowledgeOneAlert } from "@services/alert/alert.service.ts";
import { createUserClient } from "@services/db.ts";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@services/utils.ts";
import type { AcknowledgeAlertBody } from "@shared/dto/alert.dto.ts";

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "PATCH" && req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userClient = createUserClient(req);
    const body = (await req.json()) as AcknowledgeAlertBody;
    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;

    const result = await acknowledgeOneAlert(userClient, auth.userId, body.alert_id ?? "");
    if (!result.ok) {
      return jsonResponse({ error: result.error }, { status: result.status });
    }
    return jsonResponse({ ok: true });
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 500 });
  }
}
