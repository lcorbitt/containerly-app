import { corsHeaders, jsonResponse } from "../_shared/infra/cors.ts";
import { createServiceClient, createUserClient } from "../_shared/infra/supabase.ts";
import { postCustomerMessage } from "../_shared/domain/customer-access/customer-access.service.ts";

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
      container_id?: string;
      body?: string;
      author_display_name?: string;
      parent_message_id?: string | null;
    };

    const admin = createServiceClient();
    const result = await postCustomerMessage(userClient, admin, userData.user.id, {
      shipment_id: body.shipment_id ?? "",
      container_id: body.container_id,
      body: body.body ?? "",
      author_display_name: body.author_display_name,
      parent_message_id: body.parent_message_id,
    });

    if (!result.ok) {
      return jsonResponse({ error: result.error }, { status: result.status });
    }
    return jsonResponse({ message: result.message });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message.includes("Missing Supabase env") || message.includes("Authorization")) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 500 });
  }
});
