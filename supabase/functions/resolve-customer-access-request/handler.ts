import { requireAuthUserId } from "@services/auth";
import { createServiceClient, createUserClient } from "@services/db";
import { resolveCustomerAccessRequest } from "@services/customer/customer-access.service";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@services/utils";
import type { ResolveCustomerAccessRequestBody } from "@shared/dto/customer-access.dto";

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userClient = createUserClient(req);
    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;

    const admin = createServiceClient();
    const body = (await req.json()) as ResolveCustomerAccessRequestBody;
    const result = await resolveCustomerAccessRequest(userClient, admin, auth.userId, {
      access_request_id: body.access_request_id ?? "",
      action: body.action ?? "deny",
    });
    if (!result.ok) {
      return jsonResponse({ error: result.error }, { status: result.status });
    }
    return jsonResponse({
      ok: true,
      status: result.status,
      shipment_id: result.shipment_id,
      invite_id: result.invite_id,
    });
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 500 });
  }
}
