import { requireAuthUserId } from "@services/auth";
import { createUserClient } from "@services/db";
import { isLikelyUnauthorizedFromCatch, jsonResponse } from "@services/utils";
import { lookupBolContainers } from "@services/tracking/bol-lookup";

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
      bill_of_lading?: string;
      shipping_line?: string;
    };

    const result = await lookupBolContainers(userClient, auth.userId, {
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
    if (isLikelyUnauthorizedFromCatch(message)) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 500 });
  }
}
