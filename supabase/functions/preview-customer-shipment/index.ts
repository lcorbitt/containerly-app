import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  buildShipmentPortalPayload,
  DEFAULT_CUSTOMER_VISIBILITY,
  type ShipmentPortalReportMeta,
} from "../_shared/publicReport.ts";
import { createServiceClient, createUserClient } from "../_shared/supabase.ts";

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

    const { data: shipment, error: shErr } = await userClient
      .from("shipments")
      .select("id, organization_id")
      .eq("id", shipmentId)
      .maybeSingle();

    if (shErr || !shipment) {
      return jsonResponse({ error: "Shipment not found or access denied" }, { status: 404 });
    }

    const visibility = {
      ...DEFAULT_CUSTOMER_VISIBILITY,
      ...(body.visibility_settings && typeof body.visibility_settings === "object"
        ? body.visibility_settings
        : {}),
    };
    const overrides =
      body.operator_overrides && typeof body.operator_overrides === "object"
        ? body.operator_overrides
        : {};

    const admin = createServiceClient();
    const reportMeta: ShipmentPortalReportMeta = {
      id: "preview",
      title: "Customer preview",
      created_at: new Date().toISOString(),
      expires_at: null,
    };

    const result = await buildShipmentPortalPayload(
      admin,
      shipmentId,
      visibility,
      overrides,
      reportMeta,
      null,
      undefined,
    );

    if (!result.ok) {
      return jsonResponse({ error: result.error }, { status: result.status });
    }

    (result.payload as Record<string, unknown>).preview = true;
    return jsonResponse(result.payload);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message.includes("Missing Supabase env") || message.includes("Authorization")) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 500 });
  }
});
