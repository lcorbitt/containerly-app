import { requireAuthUserId } from "@services/auth";
import { createUserClient } from "@services/db";
import { updateShipmentTagsQuery } from "@services/shipment/shipment.service";
import { normalizeShipmentTagList } from "@shared/shipment-tags";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@services/utils";

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
      tags?: unknown;
    };

    const organizationId = body.organization_id?.trim() ?? "";
    const shipmentId = body.shipment_id?.trim() ?? "";
    if (!organizationId || !UUID_RE.test(organizationId)) {
      return jsonResponse({ error: "Invalid organization_id" }, { status: 400 });
    }
    if (!shipmentId || !UUID_RE.test(shipmentId)) {
      return jsonResponse({ error: "Invalid shipment_id" }, { status: 400 });
    }
    if (!Array.isArray(body.tags)) {
      return jsonResponse({ error: "tags must be an array of strings" }, { status: 400 });
    }

    const tags = normalizeShipmentTagList(body.tags.filter((t): t is string => typeof t === "string"));

    const userClient = createUserClient(req);
    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;

    const saved = await updateShipmentTagsQuery(userClient, {
      shipmentId,
      organizationId,
      tags,
    });

    return jsonResponse({ ok: true, tags: saved });
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 400 });
  }
}
