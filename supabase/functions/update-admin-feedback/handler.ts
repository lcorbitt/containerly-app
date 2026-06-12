import { requireAuthUserId, requireSuperadmin } from "@services/auth";
import { updateAdminFeedbackStatus } from "@services/feedback/feedback.service";
import { createUserClient } from "@services/db";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@services/utils";
import type { FeedbackStatus } from "@shared/dto/feedback.dto";

const VALID_STATUSES = new Set<FeedbackStatus>(["new", "reviewed", "resolved", "wont_fix"]);

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "PATCH") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userClient = createUserClient(req);
    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;

    const superadmin = await requireSuperadmin(userClient, auth.userId);
    if (!superadmin.ok) return superadmin.response;

    let body: { id?: string; status?: FeedbackStatus };
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return jsonResponse({ error: "Invalid JSON" }, { status: 400 });
    }

    const id = body.id?.trim();
    const status = body.status;
    if (!id) {
      return jsonResponse({ error: "id is required" }, { status: 400 });
    }
    if (!status || !VALID_STATUSES.has(status)) {
      return jsonResponse({ error: "Invalid status" }, { status: 400 });
    }

    const row = await updateAdminFeedbackStatus(userClient, { id, status });
    return jsonResponse({ row });
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 400 });
  }
}
