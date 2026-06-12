import { requireAuthUserId } from "@services/auth.ts";
import { createUserClient } from "@services/db.ts";
import { submitUserFeedback } from "@services/feedback/feedback.service.ts";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@services/utils.ts";
import type { SubmitFeedbackBody } from "@shared/dto/feedback.dto.ts";

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userClient = createUserClient(req);
    const body = (await req.json()) as SubmitFeedbackBody;

    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;

    const result = await submitUserFeedback(userClient, auth.userId, body);

    if (!result.ok) {
      return jsonResponse({ error: result.error }, { status: result.status });
    }
    return jsonResponse({ id: result.id });
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 500 });
  }
}
