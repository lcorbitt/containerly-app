import { requireAuthUserId } from "@supabase-shared/auth.ts";
import { createServiceClient, createUserClient } from "@supabase-shared/db.ts";
import { isLikelyUnauthorizedFromCatch, jsonResponse } from "@supabase-shared/utils.ts";
import { getShipmentForOperator } from "@supabase-shared/shipment-portal-handlers.ts";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const url = new URL(req.url);
    const shipmentId = url.searchParams.get("shipment_id")?.trim() ?? "";
    if (!shipmentId || !UUID_RE.test(shipmentId)) {
      return jsonResponse({ error: "Invalid shipment_id" }, { status: 400 });
    }

    const userClient = createUserClient(req);
    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;

    const admin = createServiceClient();
    const result = await getShipmentForOperator(userClient, admin, auth.userId, shipmentId);

    if (!result.ok) {
      return jsonResponse({ error: result.error }, { status: result.status });
    }
    return jsonResponse(result.payload);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (isLikelyUnauthorizedFromCatch(message)) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 500 });
  }
}
