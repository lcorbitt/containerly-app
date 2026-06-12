// Delegates to @services / @models; forwards signed_in token fields to the client.
import { createServiceClient } from "@services/db";
import { checkPortalAccessEmail } from "@services/customer/customer-access.service";
import { edgeErrorMessage, jsonResponse } from "@services/utils";
import type { CheckPortalAccessEmailBody } from "@shared/dto/customer-access.dto";

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const admin = createServiceClient();
    const body = (await req.json()) as CheckPortalAccessEmailBody;
    const result = await checkPortalAccessEmail(admin, {
      shipment_id: body.shipment_id ?? "",
      email: body.email ?? "",
    });
    if (!result.ok) {
      return jsonResponse({ error: result.error }, { status: result.status });
    }
    return jsonResponse({
      message: result.message,
      outcome: result.outcome,
      token_hash: result.token_hash,
      token_type: result.token_type,
    });
  } catch (e) {
    return jsonResponse({ error: edgeErrorMessage(e) }, { status: 500 });
  }
}
