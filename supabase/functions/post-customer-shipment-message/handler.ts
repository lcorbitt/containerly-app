import { requireAuthUserId } from "@supabase-shared/auth.ts";
import { createServiceClient, createUserClient } from "@supabase-shared/db.ts";
import { isLikelyUnauthorizedFromCatch, jsonResponse } from "@supabase-shared/utils.ts";
import { postPortalShipmentMessage } from "@supabase-shared/shipment-portal-messages.service.ts";

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userClient = createUserClient(req);
    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;

    const body = (await req.json()) as {
      shipment_id?: string;
      container_id?: string;
      body?: string;
      author_display_name?: string;
      parent_message_id?: string | null;
    };

    const admin = createServiceClient();
    const result = await postPortalShipmentMessage(userClient, admin, auth.userId, {
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
    if (isLikelyUnauthorizedFromCatch(message)) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 500 });
  }
}
