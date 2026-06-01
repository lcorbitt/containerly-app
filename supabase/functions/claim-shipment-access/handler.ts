import { requireAuthUserId } from "@supabase-shared/auth.ts";
import { createUserClient, tryCreateServiceClient } from "@supabase-shared/db.ts";
import { claimShipmentAccess } from "@supabase-shared/customer-access.service.ts";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@supabase-shared/utils.ts";
import type { ClaimShipmentAccessBody } from "@shared/dto/customer-access.dto.ts";

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userClient = createUserClient(req);
    const admin = tryCreateServiceClient();
    if (!admin) {
      return jsonResponse({ error: "Service unavailable" }, { status: 503 });
    }

    const body = (await req.json()) as ClaimShipmentAccessBody;
    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;

    const { data: userData } = await userClient.auth.getUser();
    const email = userData.user?.email ?? "";
    if (!email) {
      return jsonResponse({ error: "User email required" }, { status: 400 });
    }

    const result = await claimShipmentAccess(admin, auth.userId, email, body.shipment_id?.trim() ?? "");
    if (!result.ok) {
      return jsonResponse({ error: result.error }, { status: result.status });
    }
    return jsonResponse({
      access_id: result.access_id,
      shipment_id: result.shipment_id,
      already_had_access: result.already_had_access,
    });
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 500 });
  }
}
