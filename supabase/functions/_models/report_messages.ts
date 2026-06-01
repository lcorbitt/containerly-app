import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

const PORTAL_MSG_SELECT =
  "id, body, author_kind, author_user_id, author_display_name, parent_message_id, created_at, is_internal, container_id, shipment_id";

/** `report_messages` — container-scoped thread for portal. */
export function queryReportMessagesForContainers(
  client: SupabaseClient,
  containerIds: string[],
  includeInternal: boolean,
) {
  let q = client
    .from("report_messages")
    .select(PORTAL_MSG_SELECT)
    .in("container_id", containerIds)
    .order("created_at", { ascending: true })
    .limit(400);
  if (!includeInternal) q = q.eq("is_internal", false);
  return q;
}

/** `report_messages` — shipment-level thread (no container). */
export function queryReportMessagesForShipment(
  client: SupabaseClient,
  shipmentId: string,
  includeInternal: boolean,
) {
  let q = client
    .from("report_messages")
    .select(PORTAL_MSG_SELECT)
    .eq("shipment_id", shipmentId)
    .is("container_id", null)
    .order("created_at", { ascending: true })
    .limit(200);
  if (!includeInternal) q = q.eq("is_internal", false);
  return q;
}

/** `report_messages` — parent row for threaded customer reply. */
export async function fetchReportMessageParentForReply(
  client: SupabaseClient,
  parentId: string,
) {
  return client
    .from("report_messages")
    .select("id, container_id, shipment_id, is_internal")
    .eq("id", parentId)
    .maybeSingle();
}

/** `report_messages` — customer / operator inserts. */
export async function insertReportMessage(client: SupabaseClient, row: Record<string, unknown>) {
  return client
    .from("report_messages")
    .insert(row)
    .select("id, body, author_display_name, created_at, author_kind")
    .single();
}
