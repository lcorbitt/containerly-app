import { requireAuthUser, requireAuthUserId } from "@services/auth.ts";
import { createUserClient } from "@services/db.ts";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@services/utils.ts";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

import { runBolImportedNotification } from "@services/workspace/workspace.service.ts";
import type { NotifyBolImportBody } from "@shared/dto/workspace.dto.ts";

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  try {
    const userClient = createUserClient(req);
    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;
    const body = (await req.json()) as NotifyBolImportBody;
    const organizationId = body.organization_id?.trim() ?? "";
    const shipmentId = body.shipment_id?.trim() ?? "";
    const billOfLading = body.bill_of_lading?.trim() ?? "";
    const containerCount = typeof body.container_count === "number" && body.container_count > 0 ? body.container_count : 0;
    if (!UUID_RE.test(organizationId) || !UUID_RE.test(shipmentId) || !billOfLading || containerCount < 1) {
      return jsonResponse({ error: "organization_id, shipment_id, bill_of_lading, and container_count are required" }, { status: 400 });
    }
    await runBolImportedNotification({
      organizationId,
      shipmentId,
      actorUserId: auth.userId,
      billOfLading,
      containerCount,
    });
    return jsonResponse({ ok: true });
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    return jsonResponse({ error: message }, { status: 400 });
  }
}
