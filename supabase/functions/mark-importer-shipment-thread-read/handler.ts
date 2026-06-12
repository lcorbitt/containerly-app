import { requireAuthUser, requireAuthUserId } from "@services/auth.ts";
import { createUserClient } from "@services/db.ts";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@services/utils.ts";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

import { markImporterShipmentThreadReadForUser } from "@services/workspace/workspace.service.ts";

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "PATCH") return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  try {
    const url = new URL(req.url);
    let shipmentId = url.searchParams.get("shipment_id")?.trim() ?? "";
    if (!shipmentId) {
      try {
        const body = (await req.json()) as { shipment_id?: string };
        shipmentId = body.shipment_id?.trim() ?? "";
      } catch { /* query only */ }
    }
    if (!UUID_RE.test(shipmentId)) return jsonResponse({ error: "Invalid shipment_id" }, { status: 400 });
    const userClient = createUserClient(req);
    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;
    await markImporterShipmentThreadReadForUser(userClient, auth.userId, shipmentId);
    return jsonResponse({ ok: true });
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    return jsonResponse({ error: message }, { status: 400 });
  }
}
