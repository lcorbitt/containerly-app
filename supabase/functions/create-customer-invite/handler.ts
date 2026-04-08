import { requireAuthUserId } from "@supabase-shared/auth.ts";
import { createServiceClient, createUserClient } from "@supabase-shared/db.ts";
import { isLikelyUnauthorizedFromCatch, jsonResponse } from "@supabase-shared/utils.ts";
import { createCustomerInvite } from "@supabase-shared/customer-access.service.ts";

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userClient = createUserClient(req);
    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;

    const body = (await req.json()) as {
      organization_id?: string;
      shipment_id?: string;
      invited_email?: string;
      visibility_settings?: Record<string, unknown>;
    };

    const admin = createServiceClient();
    const result = await createCustomerInvite(userClient, admin, auth.userId, {
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
    if (isLikelyUnauthorizedFromCatch(message)) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 500 });
  }
}
