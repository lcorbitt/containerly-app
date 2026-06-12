import { requireAuthUserId } from "@services/auth.ts";
import { createUserClient } from "@services/db.ts";
import { updateShipmentRootCauseQuery } from "@services/shipment/shipment.service.ts";
import type { ShipmentRootCause } from "@shared/dto/performance.dto.ts";
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
      root_cause?: ShipmentRootCause | null;
    };

    const organizationId = body.organization_id?.trim() ?? "";
    const shipmentId = body.shipment_id?.trim() ?? "";
    if (!organizationId || !UUID_RE.test(organizationId)) {
      return jsonResponse({ error: "Invalid organization_id" }, { status: 400 });
    }
    if (!shipmentId || !UUID_RE.test(shipmentId)) {
      return jsonResponse({ error: "Invalid shipment_id" }, { status: 400 });
    }

    const userClient = createUserClient(req);
    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;

    const rootCause = await updateShipmentRootCauseQuery(userClient, {
      shipmentId,
      organizationId,
      rootCause: body.root_cause ?? null,
    });

    return jsonResponse({ ok: true, root_cause: rootCause });
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 400 });
  }
}
