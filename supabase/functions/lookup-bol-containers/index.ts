import { corsHeaders, jsonResponse } from "../_shared/infra/cors.ts";
import { createUserClient } from "../_shared/infra/supabase.ts";
import { lookupBolContainers } from "../_shared/domain/tracking/bol.service.ts";

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
      bill_of_lading?: string;
      shipping_line?: string;
    };

    const result = await lookupBolContainers(userClient, userData.user.id, {
      organization_id: body.organization_id ?? "",
      bill_of_lading: body.bill_of_lading ?? "",
      shipping_line: body.shipping_line,
    });

    if (!result.ok) {
      return jsonResponse({ error: result.error }, { status: result.status });
    }
    return jsonResponse({
      bill_of_lading: result.bill_of_lading,
      shipping_line_name: result.shipping_line_name,
      shipping_line_id: result.shipping_line_id,
      shipping_line: result.shipping_line,
      associated_container_numbers: result.associated_container_numbers,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message.includes("Missing Supabase env") || message.includes("Authorization")) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 500 });
  }
});
