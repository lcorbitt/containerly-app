import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { insertShipmentActivityEvent } from "@models/shipment_activity_events";
import { notifyForShipmentActivityEvent } from "@services/shipment/activity/notifications.service";
import type { CommercialFieldChange } from "@services/shipment/activity/edit.utils";

export async function recordShipmentEdited(
  client: SupabaseClient,
  organizationId: string,
  shipmentId: string,
  userId: string,
  changes: CommercialFieldChange[],
): Promise<void> {
  if (changes.length === 0) return;

  const metadata = { changed_fields: changes };
  const { error } = await insertShipmentActivityEvent(client, {
    shipment_id: shipmentId,
    event_type: "shipment_edited",
    body: "Shipment details updated",
    actor_kind: "operator",
    actor_user_id: userId,
    metadata,
  });
  if (error) throw error;

  try {
    await notifyForShipmentActivityEvent({
      client,
      organizationId,
      shipmentId,
      actorUserId: userId,
      eventType: "shipment_edited",
      metadata,
    });
  } catch {
    /* best-effort */
  }
}
