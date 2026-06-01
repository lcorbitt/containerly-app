import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

/** `shipment_notification_subscriptions` — subscriber user ids for a shipment. */
export async function listShipmentNotificationSubscriberUserIds(
  client: SupabaseClient,
  shipmentId: string,
) {
  return client
    .from("shipment_notification_subscriptions")
    .select("user_id")
    .eq("shipment_id", shipmentId);
}

export async function fetchShipmentNotificationSubscriptionForUser(
  client: SupabaseClient,
  shipmentId: string,
  userId: string,
) {
  return client
    .from("shipment_notification_subscriptions")
    .select("id")
    .eq("shipment_id", shipmentId)
    .eq("user_id", userId)
    .maybeSingle();
}

export async function insertShipmentNotificationSubscription(
  client: SupabaseClient,
  input: {
    organizationId: string;
    shipmentId: string;
    userId: string;
  },
) {
  return client.from("shipment_notification_subscriptions").insert({
    organization_id: input.organizationId,
    shipment_id: input.shipmentId,
    user_id: input.userId,
  });
}

export async function deleteShipmentNotificationSubscriptionForUser(
  client: SupabaseClient,
  shipmentId: string,
  userId: string,
) {
  return client
    .from("shipment_notification_subscriptions")
    .delete()
    .eq("shipment_id", shipmentId)
    .eq("user_id", userId);
}
