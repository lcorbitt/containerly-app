import { requireAuthUserId } from "@supabase-shared/auth.ts";
import { acknowledgeAllAlertsForViewer } from "@supabase-shared/alert-operations.service.ts";
import { createUserClient } from "@supabase-shared/db.ts";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@supabase-shared/utils.ts";
import type { AcknowledgeAllAlertsBody } from "@shared/dto/alert.dto.ts";

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "PATCH" && req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userClient = createUserClient(req);
    const body = (await req.json()) as AcknowledgeAllAlertsBody;
    const scope = body.scope === "me" ? "me" : body.scope === "org" ? "org" : null;
    if (!scope) {
      return jsonResponse({ error: "scope must be org or me" }, { status: 400 });
    }

    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;

    const result = await acknowledgeAllAlertsForViewer(userClient, auth.userId, {
      scope,
      organizationId: body.organization_id,
    });
    if (!result.ok) {
      return jsonResponse({ error: result.error }, { status: result.status });
    }
    return jsonResponse({ ok: true, acknowledged: result.acknowledged });
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 500 });
  }
}
