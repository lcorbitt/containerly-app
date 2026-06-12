import { requireAuthUser } from "@services/auth.ts";
import { createServiceClient, createUserClient } from "@services/db.ts";
import { isLikelyUnauthorizedFromCatch, jsonResponse } from "@services/utils.ts";
import { acceptCustomerInvite } from "@services/customer/customer-access.service.ts";

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userClient = createUserClient(req);
    const auth = await requireAuthUser(userClient);
    if (!auth.ok) return auth.response;

    const body = (await req.json()) as { token?: string };
    const admin = createServiceClient();
    const result = await acceptCustomerInvite(admin, auth.userId, auth.emailLower, body.token ?? "");

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
    if (isLikelyUnauthorizedFromCatch(message)) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 500 });
  }
}
