import { corsHeaders, jsonResponse } from "../_shared/infra/cors.ts";
import { createServiceClient, createUserClient } from "../_shared/infra/supabase.ts";
import { createCustomerInvite } from "../_shared/domain/customer-access/customer-access.service.ts";

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
      organization_id?: string;
      shipment_id?: string;
      invited_email?: string;
      visibility_settings?: Record<string, unknown>;
    };

    const admin = createServiceClient();
    const result = await createCustomerInvite(userClient, admin, userData.user.id, {
      organization_id: body.organization_id ?? "",
      shipment_id: body.shipment_id ?? "",
      invited_email: body.invited_email ?? "",
      visibility_settings: body.visibility_settings,
    });

    if (!result.ok) {
      return jsonResponse({ error: result.error }, { status: result.status });
    }
    return jsonResponse({
      invite_id: result.invite_id,
      invite_url: result.invite_url,
      expires_at: result.expires_at,
      token: result.token,
      visibility_settings: result.visibility_settings,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message.includes("Missing Supabase env") || message.includes("Authorization")) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 500 });
  }
});
