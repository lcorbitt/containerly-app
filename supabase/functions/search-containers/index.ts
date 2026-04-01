import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { createUserClient } from "../_shared/supabase.ts";
import { normalizeContainerNumber } from "../_shared/normalize.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userClient = createUserClient(req);
    const body = (await req.json()) as { organization_id?: string; q?: string };
    const organizationId = body.organization_id;
    const q = (body.q ?? "").trim();

    if (!organizationId || q.length < 2) {
      return jsonResponse(
        { error: "organization_id and q (min 2 chars) required" },
        { status: 400 },
      );
    }

    const normalized = normalizeContainerNumber(q);
    const safe = q.replace(/%/g, "").replace(/,/g, "").slice(0, 64);

    const { data, error } = await userClient
      .from("containers")
      .select("id, container_number, normalized_number, carrier, status, last_synced_at")
      .eq("organization_id", organizationId)
      .or(
        `container_number.ilike.%${safe}%,normalized_number.ilike.%${normalized}%`,
      )
      .limit(25);

    if (error) throw error;

    return jsonResponse({ results: data ?? [] });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse({ error: message }, { status: 500 });
  }
});
