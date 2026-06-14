import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

const PORTAL_MSG_SELECT =
  "id, body, author_kind, author_user_id, author_display_name, parent_message_id, created_at, is_internal, container_id, shipment_id";

const THREAD_INDEX_SELECT =
  "shipment_id, container_id, body, author_kind, author_user_id, author_display_name, created_at, organization_id";

/** `shipment_messages` — container-scoped thread for portal. */
export function listShipmentMessagesByContainerIds(
  client: SupabaseClient,
  containerIds: string[],
  includeInternal: boolean,
) {
  let q = client
    .from("shipment_messages")
    .select(PORTAL_MSG_SELECT)
    .in("container_id", containerIds)
    .order("created_at", { ascending: true })
    .limit(400);
  if (!includeInternal) q = q.eq("is_internal", false);
  return q;
}

/** `shipment_messages` — shipment-level thread (no container). */
export function listShipmentMessagesByShipment(
  client: SupabaseClient,
  shipmentId: string,
  includeInternal: boolean,
) {
  let q = client
    .from("shipment_messages")
    .select(PORTAL_MSG_SELECT)
    .eq("shipment_id", shipmentId)
    .is("container_id", null)
    .order("created_at", { ascending: true })
    .limit(200);
  if (!includeInternal) q = q.eq("is_internal", false);
  return q;
}

/** `shipment_messages` — parent row for threaded customer reply. */
export async function getShipmentMessageParentForReply(
  client: SupabaseClient,
  parentId: string,
) {
  return client
    .from("shipment_messages")
    .select("id, container_id, shipment_id, is_internal")
    .eq("id", parentId)
    .maybeSingle();
}

/** `shipment_messages` — customer / operator inserts. */
export async function insertShipmentMessage(client: SupabaseClient, row: Record<string, unknown>) {
  return client
    .from("shipment_messages")
    .insert(row)
    .select("id, body, author_display_name, created_at, author_kind")
    .single();
}

/** `shipment_messages` — full container workspace thread. */
export function listShipmentMessagesByContainer(client: SupabaseClient, containerId: string) {
  return client
    .from("shipment_messages")
    .select("*")
    .eq("container_id", containerId)
    .order("created_at", { ascending: true });
}

/** `shipment_messages` — shipment-scoped messages (no container). */
export function listShipmentScopeShipmentMessages(client: SupabaseClient, shipmentId: string) {
  return client
    .from("shipment_messages")
    .select("*")
    .eq("shipment_id", shipmentId)
    .is("container_id", null)
    .order("created_at", { ascending: true });
}

/** `shipment_messages` — container-scoped messages for shipment thread merge. */
export function listShipmentMessagesByContainerIdsFull(
  client: SupabaseClient,
  containerIds: string[],
) {
  return client
    .from("shipment_messages")
    .select("*")
    .in("container_id", containerIds)
    .order("created_at", { ascending: true });
}

/** `shipment_messages` — org operator thread index rows. */
export function listShipmentMessagesForOrgThreadIndex(
  client: SupabaseClient,
  organizationId: string,
  limit: number,
) {
  return client
    .from("shipment_messages")
    .select(THREAD_INDEX_SELECT)
    .eq("organization_id", organizationId)
    .eq("is_internal", false)
    .order("created_at", { ascending: false })
    .limit(limit);
}

/** `shipment_messages` — importer/customer thread index rows. */
export function listShipmentMessagesForImporterThreadIndex(client: SupabaseClient, limit: number) {
  return client
    .from("shipment_messages")
    .select(THREAD_INDEX_SELECT)
    .eq("is_internal", false)
    .order("created_at", { ascending: false })
    .limit(limit);
}

/** `shipment_messages` — author check before edit. */
export async function getShipmentMessageAuthorForEdit(client: SupabaseClient, messageId: string) {
  return client
    .from("shipment_messages")
    .select("id, author_user_id")
    .eq("id", messageId)
    .maybeSingle();
}

/** `shipment_messages` — update message body. */
export async function updateShipmentMessage(
  client: SupabaseClient,
  messageId: string,
  body: string,
) {
  return client
    .from("shipment_messages")
    .update({ body })
    .eq("id", messageId)
    .select()
    .single();
}

/** `shipment_messages` — delete by id. */
export async function deleteShipmentMessage(client: SupabaseClient, messageId: string) {
  return client.from("shipment_messages").delete().eq("id", messageId).select("id");
}

/** `shipment_messages` — workspace insert (container or shipment scope). */
export async function insertWorkspaceShipmentMessage(
  client: SupabaseClient,
  row: Record<string, unknown>,
) {
  return client.from("shipment_messages").insert(row).select().single();
}

/** `shipment_messages` — stale SLA reminder candidate messages. */
export function listStaleCustomerShipmentMessages(
  client: SupabaseClient,
  organizationId: string,
  slaCutoff: string,
  limit = 200,
) {
  return client
    .from("shipment_messages")
    .select("id, shipment_id, author_kind, created_at")
    .eq("organization_id", organizationId)
    .not("shipment_id", "is", null)
    .is("container_id", null)
    .eq("is_internal", false)
    .eq("author_kind", "customer")
    .lte("created_at", slaCutoff)
    .order("created_at", { ascending: false })
    .limit(limit);
}

/** `shipment_messages` — operator reply after customer message (SLA check). */
export function hasOperatorShipmentMessageAfter(
  client: SupabaseClient,
  shipmentId: string,
  afterCreatedAt: string,
) {
  return client
    .from("shipment_messages")
    .select("id")
    .eq("shipment_id", shipmentId)
    .is("container_id", null)
    .in("author_kind", ["operator", "team"])
    .gt("created_at", afterCreatedAt)
    .limit(1);
}
