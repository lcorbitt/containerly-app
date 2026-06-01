import { requireAuthUserId } from "@supabase-shared/auth.ts";
import { createUserClient, tryCreateServiceClient } from "@supabase-shared/db.ts";
import { updateCommercialShipment } from "@supabase-shared/shipment-operations.service.ts";
import { recordOriginalsMailed } from "@supabase-shared/document-workflow.service.ts";
import { notifyCustomerDocumentsMailed } from "@supabase-shared/notification-workflow.service.ts";
import { fetchOrganizationForPortal } from "@models/organizations.ts";
import { listActiveCustomerAccessForShipment } from "@models/shipment_customer_access.ts";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@supabase-shared/utils.ts";
import type { UpdateShipmentBody } from "@shared/dto/logistics.dto.ts";

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userClient = createUserClient(req);
    const body = (await req.json()) as UpdateShipmentBody;

    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;

    const mailTracking = body.physical_mail_tracking_number;
    const result = await updateCommercialShipment(userClient, auth.userId, body);
    if (!result.ok) {
      return jsonResponse({ error: result.error }, { status: result.status });
    }

    if (mailTracking?.trim()) {
      await recordOriginalsMailed(
        userClient,
        body.shipment_id,
        mailTracking.trim(),
        auth.userId,
      );

      const notifyClient = tryCreateServiceClient() ?? userClient;
      const { data: orgRow } = await fetchOrganizationForPortal(userClient, body.organization_id);
      const { data: customers } = await listActiveCustomerAccessForShipment(userClient, body.shipment_id);
      for (const row of customers ?? []) {
        await notifyCustomerDocumentsMailed(notifyClient, {
          organizationId: body.organization_id,
          shipmentId: body.shipment_id,
          customerUserId: row.customer_user_id as string,
          orgName: (orgRow?.name as string | undefined) ?? "Containerly",
          trackingNumber: mailTracking.trim(),
          actorUserId: auth.userId,
        });
      }
    }

    return jsonResponse({
      shipment_id: result.shipment_id,
      line_ids: result.line_ids,
    });
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 500 });
  }
}
