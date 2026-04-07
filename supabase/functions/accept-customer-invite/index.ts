import { corsHeaders, jsonResponse } from "../_shared/infra/cors.ts";
import { createServiceClient, createUserClient } from "../_shared/infra/supabase.ts";
import { acceptCustomerInvite } from "../_shared/domain/customer-access/customer-access.service.ts";

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

    const body = (await req.json()) as { token?: string };
    const admin = createServiceClient();
    const result = await acceptCustomerInvite(
      admin,
      userData.user.id,
      (userData.user.email ?? "").trim().toLowerCase(),
      body.token ?? "",
    );

    if (!result.ok) {
      const resp: Record<string, unknown> = { error: result.error };
      if ("expected_email_hint" in result) resp.expected_email_hint = result.expected_email_hint;
      return jsonResponse(resp, { status: result.status });
    }
    return jsonResponse({
      shipment_id: result.shipment_id,
      shipment_access_id: result.shipment_access_id,
      ...(result.already_had_access ? { already_had_access: true } : {}),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message.includes("Missing Supabase env") || message.includes("Authorization")) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 500 });
  }
});
