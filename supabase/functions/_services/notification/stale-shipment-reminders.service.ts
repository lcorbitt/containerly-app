import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import {
  hasOperatorShipmentMessageAfter,
  listStaleCustomerShipmentMessages,
} from "@models/shipment_messages.ts";

export async function countStaleShipmentSlaReminders(
  admin: SupabaseClient,
  orgId: string,
  slaCutoff: string,
  slaResponseHours: number,
): Promise<number> {
  const { data: msgRows, error: msgErr } = await listStaleCustomerShipmentMessages(
    admin,
    orgId,
    slaCutoff,
  );
  if (msgErr) throw msgErr;

  const seenShipments = new Set<string>();
  let remindersCreated = 0;

  for (const msg of msgRows ?? []) {
    const shipmentId = msg.shipment_id as string | null;
    if (!shipmentId || seenShipments.has(shipmentId)) continue;

    const { data: newerOperator } = await hasOperatorShipmentMessageAfter(
      admin,
      shipmentId,
      msg.created_at as string,
    );
    if ((newerOperator ?? []).length > 0) continue;

    seenShipments.add(shipmentId);

    const { data: shipmentRow } = await admin
      .from("shipments")
      .select("assignee_user_id, created_by")
      .eq("id", shipmentId)
      .maybeSingle();
    const recipient =
      (shipmentRow?.assignee_user_id as string | null) ??
      (shipmentRow?.created_by as string | null);
    if (!recipient) continue;

    const { error: alertErr } = await admin.from("alerts").insert({
      organization_id: orgId,
      shipment_id: shipmentId,
      alert_type: "SLA_RESPONSE_DUE",
      inbox_kind: "operational_alert",
      severity: "warning",
      message: "Customer waiting beyond SLA — reply when you can",
      recipient_user_id: recipient,
      details: {
        sla_response_hours: slaResponseHours,
        customer_message_at: msg.created_at,
      },
    });
    if (!alertErr) remindersCreated += 1;
  }

  return remindersCreated;
}
