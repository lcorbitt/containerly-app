import { requireAuthUserId } from "@services/auth.ts";
import { createServiceClient, createUserClient } from "@services/db.ts";
import { isLikelyUnauthorizedFromCatch, jsonResponse } from "@services/utils.ts";
import { completeCustomerSetup } from "@services/customer/customer-access.service.ts";

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userClient = createUserClient(req);
    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;

    const body = (await req.json()) as { shipment_id?: string };
    const admin = createServiceClient();
    const result = await completeCustomerSetup(
      userClient,
      admin,
      auth.userId,
      body.shipment_id?.trim() ?? "",
    );

    if (!result.ok) {
      return jsonResponse({ error: result.error }, { status: result.status });
    }
    return jsonResponse({ ok: true, profile_completed_at: result.profile_completed_at });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (isLikelyUnauthorizedFromCatch(message)) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 500 });
  }
}
