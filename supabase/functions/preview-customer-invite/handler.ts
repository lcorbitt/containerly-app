import { createServiceClient } from "@services/db";
import { previewCustomerInvite } from "@services/customer/customer-access.service";
import { edgeErrorMessage, jsonResponse } from "@services/utils";
import type { PreviewCustomerInviteBody } from "@shared/dto/customer-access.dto";

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const admin = createServiceClient();
    const body = (await req.json()) as PreviewCustomerInviteBody;
    const result = await previewCustomerInvite(admin, body.token ?? "");
    if (!result.ok) {
      return jsonResponse({ error: result.error }, { status: result.status });
    }
    return jsonResponse({
      invited_email: result.invited_email,
      invited_email_masked: result.invited_email_masked,
      org_name: result.org_name,
      shipment_label: result.shipment_label,
      shipment_id: result.shipment_id,
    });
  } catch (e) {
    return jsonResponse({ error: edgeErrorMessage(e) }, { status: 500 });
  }
}
