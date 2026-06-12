import { requireAuthUserId } from "@services/auth.ts";
import { createUserClient } from "@services/db.ts";
import {
  deleteShipmentParticipantQuery,
  fetchShipmentParticipantRowQuery,
  runParticipantRemovedNotification,
} from "@services/shipment/shipment.service.ts";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@services/utils.ts";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = (await req.json()) as { participant_id?: string };
    const participantId = body.participant_id?.trim() ?? "";
    if (!participantId || !UUID_RE.test(participantId)) {
      return jsonResponse({ error: "Invalid participant_id" }, { status: 400 });
    }

    const userClient = createUserClient(req);
    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;

    const row = await fetchShipmentParticipantRowQuery(userClient, participantId);
    await deleteShipmentParticipantQuery(userClient, participantId);

    if (row?.shipment_id && row.user_id) {
      const { data: ship } = await userClient
        .from("shipments")
        .select("organization_id")
        .eq("id", row.shipment_id)
        .maybeSingle();
      if (ship?.organization_id) {
        try {
          await runParticipantRemovedNotification({
            organizationId: ship.organization_id as string,
            shipmentId: row.shipment_id,
            participantUserId: row.user_id,
            actorUserId: auth.userId,
          });
        } catch {
          /* best-effort */
        }
      }
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
