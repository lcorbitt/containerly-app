import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

const PORTAL_ATT_SELECT =
  "id, file_name, content_type, file_size_bytes, created_at, container_id, shipment_id, report_message_id, storage_path, is_internal, document_type, document_group, approval_status, rejection_reason, reviewed_at, shipment_line_id, uploaded_by_kind";

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

export async function fetchWorkspaceAttachmentById(client: SupabaseClient, attachmentId: string) {
  return client.from("workspace_attachments").select("*").eq("id", attachmentId).maybeSingle();
}

export async function updateWorkspaceAttachmentReview(
  client: SupabaseClient,
  attachmentId: string,
  fields: Record<string, unknown>,
) {
  return client.from("workspace_attachments").update(fields).eq("id", attachmentId).select("*").single();
}

export async function listCustomerVisibleDraftAttachments(
  client: SupabaseClient,
  shipmentId: string,
  containerIds: string[],
) {
  const shipmentAtt = await client
    .from("workspace_attachments")
    .select("id, approval_status, document_group, is_internal")
    .eq("shipment_id", shipmentId)
    .eq("is_internal", false)
    .not("document_group", "is", null);

  let containerAtt = { data: [] as Record<string, unknown>[], error: null as null };
  if (containerIds.length > 0) {
    containerAtt = await client
      .from("workspace_attachments")
      .select("id, approval_status, document_group, is_internal")
      .in("container_id", containerIds)
      .eq("is_internal", false)
      .not("document_group", "is", null);
  }

  if (shipmentAtt.error) return shipmentAtt;
  if (containerAtt.error) return containerAtt;

  return {
    data: [...(shipmentAtt.data ?? []), ...(containerAtt.data ?? [])],
    error: null,
  };
}
