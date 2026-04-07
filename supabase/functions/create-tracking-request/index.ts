import { corsHeaders, jsonResponse } from "../_shared/infra/cors.ts";
import { createUserClient, tryCreateServiceClient } from "../_shared/infra/supabase.ts";
import { createTrackingRequest } from "../_shared/domain/tracking/tracking.service.ts";
import type { CreateTrackingRequestBody } from "@shared/dto/tracking.dto.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userClient = createUserClient(req);
    const admin = tryCreateServiceClient();
    const body = (await req.json()) as CreateTrackingRequestBody;

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await createTrackingRequest(userClient, admin, userData.user.id, body);

    if (!result.ok) {
      return jsonResponse({ error: result.error }, { status: result.status });
    }
    return jsonResponse({
      tracking_request: result.tracking_request,
      ...(result.sync_error ? { sync_error: result.sync_error } : {}),
    });
  } catch (e) {
    const message =
      e instanceof Error
        ? e.message
        : e && typeof e === "object" && "message" in e
          ? String((e as { message: unknown }).message)
          : typeof e === "object"
            ? JSON.stringify(e)
            : String(e);
    return jsonResponse({ error: message }, { status: 500 });
  }
});
