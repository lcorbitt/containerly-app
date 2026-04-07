import { corsHeaders, jsonResponse } from "../_shared/infra/cors.ts";
import { createServiceClient, createUserClient } from "../_shared/infra/supabase.ts";
import { previewShipmentForImporter } from "../_shared/domain/shipment-portal/shipment-portal.service.ts";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userClient = createUserClient(req);
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }

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
    if (message.includes("Missing Supabase env") || message.includes("Authorization")) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 500 });
  }
});
