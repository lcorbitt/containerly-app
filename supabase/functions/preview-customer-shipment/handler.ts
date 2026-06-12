import { requireAuthUserId } from "@services/auth";
import { createServiceClient, createUserClient } from "@services/db";
import { isLikelyUnauthorizedFromCatch, jsonResponse } from "@services/utils";
import { previewShipmentForImporter } from "@services/shipment/portal/handlers";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userClient = createUserClient(req);
    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;

    const body = (await req.json()) as {
      shipment_id?: string;
      visibility_settings?: Record<string, unknown>;
      operator_overrides?: Record<string, unknown>;
    };
    const shipmentId = body.shipment_id?.trim() ?? "";
    if (!shipmentId || !UUID_RE.test(shipmentId)) {
      return jsonResponse({ error: "Invalid shipment_id" }, { status: 400 });
    }

    const admin = createServiceClient();
    const result = await previewShipmentForImporter(
      userClient,
      admin,
      shipmentId,
      body.visibility_settings ?? {},
      body.operator_overrides ?? {},
    );

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
