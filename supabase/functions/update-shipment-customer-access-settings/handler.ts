import { requireAuthUserId } from "@services/auth";
import { createUserClient } from "@services/db";
import { updateShipmentCustomerAccessSettingsQuery } from "@services/shipment/shipment.service";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@services/utils";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = (await req.json()) as {
      access_id?: string;
      visibility_settings?: Record<string, boolean>;
      operator_overrides?: Record<string, string>;
    };

    const accessId = body.access_id?.trim() ?? "";
    if (!accessId || !UUID_RE.test(accessId)) {
      return jsonResponse({ error: "Invalid access_id" }, { status: 400 });
    }
    if (!body.visibility_settings || typeof body.visibility_settings !== "object") {
      return jsonResponse({ error: "visibility_settings required" }, { status: 400 });
    }
    if (!body.operator_overrides || typeof body.operator_overrides !== "object") {
      return jsonResponse({ error: "operator_overrides required" }, { status: 400 });
    }

    const userClient = createUserClient(req);
    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;

    await updateShipmentCustomerAccessSettingsQuery(userClient, {
      accessId,
      visibilitySettings: body.visibility_settings,
      operatorOverrides: body.operator_overrides,
    });

    return jsonResponse({ ok: true });
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 400 });
  }
}
