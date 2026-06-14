import { requireAuthUserId } from "@services/auth.ts";
import { createUserClient } from "@services/db.ts";
import {
  createShipmentParticipantQuery,
  runParticipantAddedNotification,
} from "@services/shipment/shipment.service.ts";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@services/utils.ts";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = (await req.json()) as {
      organization_id?: string;
      shipment_id?: string;
      user_id?: string;
    };

    const organizationId = body.organization_id?.trim() ?? "";
    const shipmentId = body.shipment_id?.trim() ?? "";
    const targetUserId = body.user_id?.trim() ?? "";

    if (!organizationId || !UUID_RE.test(organizationId)) {
      return jsonResponse({ error: "Invalid organization_id" }, { status: 400 });
    }
    if (!shipmentId || !UUID_RE.test(shipmentId)) {
      return jsonResponse({ error: "Invalid shipment_id" }, { status: 400 });
    }
    if (!targetUserId || !UUID_RE.test(targetUserId)) {
      return jsonResponse({ error: "user_id required" }, { status: 400 });
    }

    const userClient = createUserClient(req);
    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;

    await createShipmentParticipantQuery(userClient, { shipmentId, userId: targetUserId });

    try {
      await runParticipantAddedNotification({
        organizationId,
        shipmentId,
        participantUserId: targetUserId,
        actorUserId: auth.userId,
      });
    } catch {
      /* best-effort */
    }

    return jsonResponse({ ok: true });
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 400 });
  }
}
