import { requireAuthUserId } from "@supabase-shared/auth.ts";
import { createUserClient, tryCreateServiceClient } from "@supabase-shared/db.ts";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@supabase-shared/utils.ts";
import { createTrackingRequest } from "@supabase-shared/tracking-operations.service.ts";
import type { CreateTrackingRequestBody } from "@shared/dto/tracking.dto.ts";

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userClient = createUserClient(req);
    const admin = tryCreateServiceClient();
    const body = (await req.json()) as CreateTrackingRequestBody;

    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;

    const result = await createTrackingRequest(userClient, admin, auth.userId, body);

    if (!result.ok) {
      return jsonResponse({ error: result.error }, { status: result.status });
    }
    return jsonResponse({
      tracking_request: result.tracking_request,
      ...(result.sync_error ? { sync_error: result.sync_error } : {}),
    });
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 500 });
  }
}
