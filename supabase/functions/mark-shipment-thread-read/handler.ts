import { requireAuthUser, requireAuthUserId } from "@services/auth";
import { createUserClient } from "@services/db";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@services/utils";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

import { markShipmentThreadReadForUser } from "@services/workspace/workspace.service";

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "PATCH") return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  try {
    let organizationId = "";
    let shipmentId = "";
    const url = new URL(req.url);
    organizationId = url.searchParams.get("organization_id")?.trim() ?? "";
    shipmentId = url.searchParams.get("shipment_id")?.trim() ?? "";
    if (!organizationId || !shipmentId) {
      try {
        const body = (await req.json()) as { organization_id?: string; shipment_id?: string };
        organizationId = body.organization_id?.trim() ?? organizationId;
        shipmentId = body.shipment_id?.trim() ?? shipmentId;
      } catch { /* query params only */ }
    }
    if (!UUID_RE.test(organizationId) || !UUID_RE.test(shipmentId)) {
      return jsonResponse({ error: "Invalid organization_id or shipment_id" }, { status: 400 });
    }
    const userClient = createUserClient(req);
    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;
    await markShipmentThreadReadForUser(userClient, auth.userId, organizationId, shipmentId);
    return jsonResponse({ ok: true });
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    return jsonResponse({ error: message }, { status: 400 });
  }
}
