import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

/** `shipments` — id + org for access checks. */
export async function fetchShipmentIdAndOrganization(
  client: SupabaseClient,
  shipmentId: string,
) {
  return client.from("shipments").select("id, organization_id").eq("id", shipmentId).maybeSingle();
}

/** `shipments` — portal operator path (membership / superadmin). */
export async function fetchShipmentPortalOperatorRow(
  client: SupabaseClient,
  shipmentId: string,
) {
  return client
    .from("shipments")
    .select("id, organization_id, created_at, assignee_user_id")
    .eq("id", shipmentId)
    .maybeSingle();
}

/** `shipments` — preview path. */
export async function fetchShipmentIdOrgForPreview(
  client: SupabaseClient,
  shipmentId: string,
) {
  return client.from("shipments").select("id, organization_id").eq("id", shipmentId).maybeSingle();
}

/** `shipments` — portal payload header. */
export async function fetchShipmentPortalHeader(client: SupabaseClient, shipmentId: string) {
  return client
    .from("shipments")
    .select(
      "id, organization_id, order_number, carrier_booking_number, container_number, bill_of_lading, shipping_line, status, customer_name, consignee, country, port_of_loading, port_of_destination, estimated_departure_at, estimated_arrival_at, freight_booking_carrier, vessel, voyage, health_certificate_no, trade_terms, physical_mail_tracking_number, physical_mail_sent_at, workflow_status, risk_level, risk_message",
    )
    .eq("id", shipmentId)
    .maybeSingle();
}

export async function updateShipmentCommercial(
  client: SupabaseClient,
  shipmentId: string,
  fields: Record<string, unknown>,
) {
  return client.from("shipments").update(fields).eq("id", shipmentId);
}

export async function fetchShipmentTagsInOrganization(
  client: SupabaseClient,
  shipmentId: string,
  organizationId: string,
) {
  return client
    .from("shipments")
    .select("tags")
    .eq("id", shipmentId)
    .eq("organization_id", organizationId)
    .maybeSingle();
}

export async function updateShipmentTagsInOrganization(
  client: SupabaseClient,
  input: {
    shipmentId: string;
    organizationId: string;
    tags: string[];
  },
) {
  return client
    .from("shipments")
    .update({ tags: input.tags })
    .eq("id", input.shipmentId)
    .eq("organization_id", input.organizationId);
}

export async function listOrganizationShipmentTagRows(
  client: SupabaseClient,
  organizationId: string,
) {
  return client.from("shipments").select("tags").eq("organization_id", organizationId);
}

/** `shipments` — find existing BOL batch shipment. */
export async function fetchShipmentIdByGroupId(
  client: SupabaseClient,
  organizationId: string,
  shipmentGroupId: string,
) {
  return client
    .from("shipments")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("shipment_group_id", shipmentGroupId)
    .maybeSingle();
}

export async function updateShipmentShippingLine(
  client: SupabaseClient,
  shipmentId: string,
  shippingLine: string,
) {
  return client.from("shipments").update({ shipping_line: shippingLine }).eq("id", shipmentId);
}

type ShipmentInsert = Record<string, unknown>;

export async function insertShipment(client: SupabaseClient, row: ShipmentInsert) {
  return client.from("shipments").insert(row).select("id").single();
}

/** `shipments` — attach tracking to existing shipment in org. */
export async function fetchShipmentInOrganization(
  client: SupabaseClient,
  shipmentId: string,
  organizationId: string,
) {
  return client
    .from("shipments")
    .select("id, risk_level")
    .eq("id", shipmentId)
    .eq("organization_id", organizationId)
    .maybeSingle();
}

export async function fetchShipmentAssignee(
  client: SupabaseClient,
  shipmentId: string,
) {
  return client.from("shipments").select("assignee_user_id").eq("id", shipmentId).maybeSingle();
}

export async function updateShipmentAssigneeIfUnset(
  client: SupabaseClient,
  shipmentId: string,
  assigneeUserId: string,
) {
  return client.from("shipments").update({ assignee_user_id: assigneeUserId }).eq("id", shipmentId);
}

export async function fetchShipmentShippingLine(
  client: SupabaseClient,
  shipmentId: string,
) {
  return client.from("shipments").select("shipping_line").eq("id", shipmentId).maybeSingle();
}

/** `shipments` — hard delete within org (admin / superadmin via RLS). */
export async function deleteShipmentInOrganization(
  client: SupabaseClient,
  shipmentId: string,
  organizationId: string,
) {
  return client
    .from("shipments")
    .delete()
    .eq("id", shipmentId)
    .eq("organization_id", organizationId);
}
