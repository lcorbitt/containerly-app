import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { fetchBolContainers, getJsoncargoConfig } from "../_shared/jsoncargoClient.ts";
import { toJsoncargoShippingLineParam } from "../_shared/jsoncargoShippingLine.ts";
import { createUserClient } from "../_shared/supabase.ts";

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
      organization_id?: string;
      bill_of_lading?: string;
      /** Optional JSONCargo carrier enum for BOL requests that require `shipping_line`. */
      shipping_line?: string;
    };

    const orgId = body.organization_id?.trim() ?? "";
    const bol = body.bill_of_lading?.trim() ?? "";
    if (!orgId || !UUID_RE.test(orgId)) {
      return jsonResponse({ error: "Invalid organization_id" }, { status: 400 });
    }
    if (!bol) {
      return jsonResponse({ error: "bill_of_lading required" }, { status: 400 });
    }

    const [{ data: mem }, { data: prof }] = await Promise.all([
      userClient
        .from("organization_members")
        .select("organization_id")
        .eq("organization_id", orgId)
        .eq("user_id", userData.user.id)
        .maybeSingle(),
      userClient.from("profiles").select("role").eq("id", userData.user.id).maybeSingle(),
    ]);

    const isSuper = (prof?.role as string | undefined) === "superadmin";
    if (!isSuper && !mem) {
      return jsonResponse({ error: "Not a member of this organization" }, { status: 403 });
    }

    const cfg = getJsoncargoConfig();
    if (!cfg) {
      return jsonResponse(
        { error: "External tracking API not configured (EXTERNAL_TRACKING_API_URL / KEY)" },
        { status: 503 },
      );
    }

    const clientLine = body.shipping_line?.trim() || null;
    const envelope = await fetchBolContainers(cfg.baseUrl, cfg.apiKey, bol, {
      shippingLine: clientLine ?? undefined,
    });
    const data = envelope.data as Record<string, unknown> | undefined;
    const nums = data?.associated_container_numbers;
    const list = Array.isArray(nums) ? nums.map((x) => String(x).trim().toUpperCase()).filter(Boolean) : [];

    const mapped = toJsoncargoShippingLineParam(
      data?.shipping_line_name as string | undefined,
      data?.shipping_line_id as string | undefined,
    );
    const shipping_line = mapped ?? clientLine;

    return jsonResponse({
      bill_of_lading: data?.bill_of_lading ?? bol,
      shipping_line_name: data?.shipping_line_name ?? null,
      shipping_line_id: data?.shipping_line_id ?? null,
      shipping_line,
      associated_container_numbers: list,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message.includes("Missing Supabase env") || message.includes("Authorization")) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 500 });
  }
});
