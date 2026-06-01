import { requireAuthUserId } from "@supabase-shared/auth.ts";
import { createUserClient } from "@supabase-shared/db.ts";
import { deleteCommercialShipment } from "@supabase-shared/shipment-operations.service.ts";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@supabase-shared/utils.ts";
import type { DeleteShipmentBody } from "@shared/dto/logistics.dto.ts";

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userClient = createUserClient(req);
    const body = (await req.json()) as DeleteShipmentBody;

    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;

    const result = await deleteCommercialShipment(userClient, auth.userId, body);
    if (!result.ok) {
      return jsonResponse({ error: result.error }, { status: result.status });
    }

    return jsonResponse({ shipment_id: result.shipment_id });
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 500 });
  }
}
