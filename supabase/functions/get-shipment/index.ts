import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { createServiceClient, createUserClient } from "../_shared/supabase.ts";
import {
  buildImporterGrantShipmentPayload,
  buildShipmentPortalPayload,
  OPERATOR_SHIPMENT_PORTAL_VISIBILITY,
  type ShipmentPortalReportMeta,
} from "../_shared/publicReport.ts";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const url = new URL(req.url);
    const shipmentId = url.searchParams.get("shipment_id")?.trim() ?? "";
    if (!shipmentId || !UUID_RE.test(shipmentId)) {
      return jsonResponse({ error: "Invalid shipment_id" }, { status: 400 });
    }

    const userClient = createUserClient(req);
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    const uid = userData.user.id;

    const { data: shipment, error: shErr } = await userClient
      .from("shipments")
      .select("id, organization_id, created_at")
      .eq("id", shipmentId)
      .maybeSingle();

    if (shErr) {
      return jsonResponse({ error: shErr.message }, { status: 500 });
    }
    if (!shipment) {
      return jsonResponse({ error: "Shipment not found" }, { status: 404 });
    }

    const [{ data: membership }, { data: profile }] = await Promise.all([
      userClient
        .from("organization_members")
        .select("id")
        .eq("organization_id", shipment.organization_id as string)
        .eq("user_id", uid)
        .maybeSingle(),
      userClient.from("profiles").select("role").eq("id", uid).maybeSingle(),
    ]);

    const isPlatformSuperadmin = (profile?.role as string | undefined) === "superadmin";

    const admin = createServiceClient();

    if (membership || isPlatformSuperadmin) {
      const reportMeta: ShipmentPortalReportMeta = {
        id: shipment.id as string,
        title: null,
        created_at: shipment.created_at as string,
        expires_at: null,
      };

      const result = await buildShipmentPortalPayload(
        admin,
        shipmentId,
        OPERATOR_SHIPMENT_PORTAL_VISIBILITY,
        {},
        reportMeta,
        null,
        { includeInternalMessages: true },
      );

      if (!result.ok) {
        return jsonResponse({ error: result.error }, { status: result.status });
      }

      const payload = result.payload as Record<string, unknown>;
      payload.viewer = "operator";
      payload.shipment_id = shipmentId;
      return jsonResponse(payload);
    }

    const { data: access, error: accErr } = await userClient
      .from("shipment_customer_access")
      .select("*")
      .eq("shipment_id", shipmentId)
      .eq("customer_user_id", uid)
      .is("revoked_at", null)
      .maybeSingle();

    if (accErr) {
      return jsonResponse({ error: accErr.message }, { status: 500 });
    }
    if (!access) {
      return jsonResponse({ error: "No access to this shipment" }, { status: 403 });
    }

    const result = await buildImporterGrantShipmentPayload(admin, access as Record<string, unknown>);
    if (!result.ok) {
      return jsonResponse({ error: result.error }, { status: result.status });
    }

    const payload = result.payload as Record<string, unknown>;
    payload.viewer = "importer";
    return jsonResponse(payload);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message.includes("Missing Supabase env") || message.includes("Authorization")) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 500 });
  }
});
