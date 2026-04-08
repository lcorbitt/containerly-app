import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

const PORTAL_ATT_SELECT =
  "id, file_name, content_type, file_size_bytes, created_at, container_id, shipment_id, report_message_id, storage_path, is_internal";

/** `workspace_attachments` — documents on containers for portal. */
export async function listWorkspaceAttachmentsForContainers(
  client: SupabaseClient,
  containerIds: string[],
  limit = 100,
) {
  if (containerIds.length === 0) {
    return { data: [] as Record<string, unknown>[], error: null };
  }
  return client
    .from("workspace_attachments")
    .select(PORTAL_ATT_SELECT)
    .in("container_id", containerIds)
    .order("created_at", { ascending: false })
    .limit(limit);
}

/** `workspace_attachments` — shipment-level documents. */
export async function listWorkspaceAttachmentsForShipment(
  client: SupabaseClient,
  shipmentId: string,
  limit = 50,
) {
  return client
    .from("workspace_attachments")
    .select(PORTAL_ATT_SELECT)
    .eq("shipment_id", shipmentId)
    .is("container_id", null)
    .order("created_at", { ascending: false })
    .limit(limit);
}
