import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { buildPublicReportPayload } from "../_shared/publicReport.ts";

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
    const id = url.searchParams.get("id")?.trim() ?? "";
    if (!id || !UUID_RE.test(id)) {
      return jsonResponse({ error: "Invalid report id" }, { status: 400 });
    }

    const admin = createServiceClient();
    const result = await buildPublicReportPayload(admin, id);

    if (!result.ok) {
      return jsonResponse({ error: result.error }, { status: result.status });
    }

    const { data: link } = await admin
      .from("shared_reports")
      .select("tracking_request_id")
      .eq("id", id)
      .single();

    if (link?.tracking_request_id) {
      await admin.from("report_activity").insert({
        tracking_request_id: link.tracking_request_id as string,
        shared_report_id: id,
        actor_user_id: null,
        action: "public_view",
        metadata: {},
      });
    }

    return jsonResponse(result.payload);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse({ error: message }, { status: 500 });
  }
});
