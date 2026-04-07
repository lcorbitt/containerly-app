import { corsHeaders, jsonResponse } from "../_shared/infra/cors.ts";
import { createServiceClient, createUserClient } from "../_shared/infra/supabase.ts";
import { completeCustomerSetup } from "../_shared/domain/customer-access/customer-access.service.ts";

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

    const body = (await req.json()) as { shipment_id?: string };
    const admin = createServiceClient();
    const result = await completeCustomerSetup(
      userClient,
      admin,
      userData.user.id,
      body.shipment_id?.trim() ?? "",
    );

    if (!result.ok) {
      return jsonResponse({ error: result.error }, { status: result.status });
    }
    return jsonResponse({ ok: true, profile_completed_at: result.profile_completed_at });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message.includes("Missing Supabase env") || message.includes("Authorization")) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 500 });
  }
});
