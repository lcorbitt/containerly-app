import { requireAuthUserId } from "@services/auth";
import { createUserClient, tryCreateServiceClient } from "@services/db";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@services/utils";
import { createTrackingRequest } from "@services/tracking/tracking.service";
import type { CreateTrackingRequestBody } from "@shared/dto/tracking.dto";

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
      ...(result.shipment_id ? { shipment_id: result.shipment_id } : {}),
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
