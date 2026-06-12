import { requireAuthUserId } from "@services/auth";
import { createUserClient, tryCreateServiceClient } from "@services/db";
import { reviewShipmentDocument } from "@services/shipment/document.service";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@services/utils";
import type { ReviewShipmentDocumentBody } from "@shared/dto/logistics.dto";

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userClient = createUserClient(req);
    const admin = tryCreateServiceClient();
    const body = (await req.json()) as ReviewShipmentDocumentBody;

    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;

    const result = await reviewShipmentDocument(userClient, admin, auth.userId, body);
    if (!result.ok) {
      return jsonResponse({ error: result.error }, { status: result.status });
    }
    return jsonResponse({
      attachment_id: result.attachment_id,
      approval_status: result.approval_status,
      workflow_status: result.workflow_status,
    });
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 500 });
  }
}
