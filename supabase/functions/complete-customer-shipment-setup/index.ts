import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
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
    const uid = userData.user.id;

    const body = (await req.json()) as { shipment_id?: string };
    const shipmentId = body.shipment_id?.trim() ?? "";
    if (!shipmentId || !UUID_RE.test(shipmentId)) {
      return jsonResponse({ error: "Invalid shipment_id" }, { status: 400 });
    }

    const { data: access, error: accErr } = await userClient
      .from("shipment_customer_access")
      .select("id")
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

    const admin = createServiceClient();
    const now = new Date().toISOString();
    const { error: upErr } = await admin
      .from("shipment_customer_access")
      .update({ profile_completed_at: now, configuration_reminder_due_at: null })
      .eq("id", access.id as string);

    if (upErr) throw upErr;

    return jsonResponse({ ok: true, profile_completed_at: now });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message.includes("Missing Supabase env") || message.includes("Authorization")) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 500 });
  }
});
