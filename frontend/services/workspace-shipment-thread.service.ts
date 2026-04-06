import { createClient } from "@/lib/supabase/client";
import { profileDisplayName } from "@/lib/author-display-name";
import { collectMessageSubtreeIds } from "@/lib/report-message-tree";
import {
  ATTACHMENT_DISPLAY_NAME_MAX_LEN,
  buildShipmentAttachmentPath,
  MAX_ATTACHMENT_FILE_BYTES,
  MAX_ATTACHMENT_SIZE_LABEL,
  MAX_ATTACHMENTS_PER_MESSAGE,
  WORKSPACE_FILES_BUCKET,
} from "@/lib/workspace-files";
import { createWorkspaceStorageSignedUrl } from "@/services/workspace-storage.service";
import type { ReportMessage, WorkspaceAttachment } from "@/types/database";

export type ShipmentScopeLoadResult =
  | { ok: false; error: string }
  | {
      ok: true;
      messages: ReportMessage[];
      attachments: WorkspaceAttachment[];
      messageAuthorByUserId: Record<string, string>;
      currentUserId: string;
    };

export async function loadShipmentScopeThread(input: {
  organizationId: string;
  shipmentId: string;
}): Promise<ShipmentScopeLoadResult> {
  const supabase = createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return { ok: false, error: "Not signed in" };

  const { data: sh, error: shErr } = await supabase
    .from("shipments")
    .select("id, organization_id")
    .eq("id", input.shipmentId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();

  if (shErr || !sh) return { ok: false, error: shErr?.message ?? "Shipment not found." };

  const [msgRes, attRes] = await Promise.all([
    supabase
      .from("report_messages")
      .select("*")
      .eq("shipment_id", input.shipmentId)
      .is("container_id", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("workspace_attachments")
      .select("*")
      .eq("shipment_id", input.shipmentId)
      .is("container_id", null)
      .order("created_at", { ascending: false }),
  ]);

  if (msgRes.error) return { ok: false, error: msgRes.error.message };

  const msgList = (msgRes.data as ReportMessage[]) ?? [];
  const attRows: WorkspaceAttachment[] = attRes.error
    ? []
    : ((attRes.data as WorkspaceAttachment[]) ?? []);

  const authorIds = [
    ...new Set(msgList.map((m) => m.author_user_id).filter((id): id is string => Boolean(id))),
  ];
  const uploaderIds = [...new Set(attRows.map((a) => a.uploaded_by))];
  const profileIds = [...new Set([...authorIds, ...uploaderIds])];
  const nameByUser: Record<string, string> = {};
  if (profileIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", profileIds);
    for (const p of profs ?? []) {
      const id = p.id as string;
      nameByUser[id] = profileDisplayName({
        full_name: p.full_name as string | null,
        email: p.email as string | null,
      });
    }
  }

  return {
    ok: true,
    messages: msgList,
    attachments: attRows,
    messageAuthorByUserId: nameByUser,
    currentUserId: u.user.id,
  };
}

async function persistShipmentAttachmentFile(
  supabase: ReturnType<typeof createClient>,
  args: {
    organizationId: string;
    shipmentId: string;
    userId: string;
    file: File;
    reportMessageId: string | null;
    isInternal: boolean;
  },
): Promise<WorkspaceAttachment> {
  const { organizationId, shipmentId, userId, file, reportMessageId, isInternal } = args;
  if (file.size > MAX_ATTACHMENT_FILE_BYTES) {
    throw new Error(`${file.name} is too large (max ${MAX_ATTACHMENT_SIZE_LABEL})`);
  }
  const { path } = buildShipmentAttachmentPath(organizationId, shipmentId, file);
  const { error: upErr } = await supabase.storage
    .from(WORKSPACE_FILES_BUCKET)
    .upload(path, file, {
      contentType: file.type || undefined,
      upsert: false,
    });
  if (upErr) throw new Error(upErr.message);

  const insertRow: {
    organization_id: string;
    shipment_id: string;
    container_id: null;
    storage_path: string;
    file_name: string;
    content_type: string | null;
    file_size_bytes: number;
    uploaded_by: string;
    is_internal: boolean;
    report_message_id?: string;
  } = {
    organization_id: organizationId,
    shipment_id: shipmentId,
    container_id: null,
    is_internal: isInternal,
    storage_path: path,
    file_name: file.name,
    content_type: file.type || null,
    file_size_bytes: file.size,
    uploaded_by: userId,
  };
  if (reportMessageId) insertRow.report_message_id = reportMessageId;

  const { data: inserted, error: insErr } = await supabase
    .from("workspace_attachments")
    .insert(insertRow)
    .select()
    .single();
  if (insErr) {
    await supabase.storage.from(WORKSPACE_FILES_BUCKET).remove([path]);
    throw new Error(insErr.message);
  }
  if (!inserted) {
    await supabase.storage.from(WORKSPACE_FILES_BUCKET).remove([path]);
    throw new Error("Database did not return the new attachment row (check RLS SELECT on insert).");
  }
  return inserted as WorkspaceAttachment;
}

export async function deleteShipmentScopeMessage(input: {
  messageId: string;
  messages: ReportMessage[];
}): Promise<{ deletedIds: Set<string> }> {
  const supabase = createClient();
  const idsToRemove = collectMessageSubtreeIds(input.messages, input.messageId);
  const { data: deletedRows, error } = await supabase
    .from("report_messages")
    .delete()
    .eq("id", input.messageId)
    .select("id");
  if (error) throw new Error(error.message);
  if (!deletedRows?.length) {
    throw new Error(
      "Could not delete this message. It may have already been removed, or you can only delete messages you posted.",
    );
  }
  return { deletedIds: idsToRemove };
}

export async function insertShipmentScopeReportMessage(input: {
  shipmentId: string;
  body: string;
  internalOnly: boolean;
  replyParentId: string | null;
}): Promise<string> {
  const supabase = createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");

  const { data: selfProf } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", u.user.id)
    .maybeSingle();
  const displayName = profileDisplayName({
    full_name: selfProf?.full_name as string | null,
    email: (selfProf?.email as string | null) ?? u.user.email,
  });

  const { data: inserted, error } = await supabase
    .from("report_messages")
    .insert({
      shipment_id: input.shipmentId,
      container_id: null,
      author_user_id: u.user.id,
      author_kind: "member",
      author_display_name: displayName,
      is_internal: input.internalOnly,
      body: input.body,
      parent_message_id: input.replyParentId,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  if (!inserted) throw new Error("Message was not saved.");
  return (inserted as ReportMessage).id;
}

export async function persistShipmentScopeAttachment(input: {
  organizationId: string;
  shipmentId: string;
  userId: string;
  file: File;
  reportMessageId: string | null;
  isInternal: boolean;
}): Promise<WorkspaceAttachment> {
  return persistShipmentAttachmentFile(createClient(), input);
}

export async function createWorkspaceAttachmentSignedUrl(storagePath: string): Promise<string> {
  return createWorkspaceStorageSignedUrl(storagePath, 3600);
}

export async function uploadShipmentScopeStandaloneFiles(input: {
  organizationId: string;
  shipmentId: string;
  files: File[];
  isInternal: boolean;
}): Promise<WorkspaceAttachment[]> {
  const supabase = createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Sign in to upload files.");
  const out: WorkspaceAttachment[] = [];
  for (const file of input.files) {
    const inserted = await persistShipmentAttachmentFile(supabase, {
      organizationId: input.organizationId,
      shipmentId: input.shipmentId,
      userId: u.user.id,
      file,
      reportMessageId: null,
      isInternal: input.isInternal,
    });
    out.push(inserted);
  }
  return out;
}

export async function renameWorkspaceAttachmentDisplayName(
  attachmentId: string,
  trimmedName: string,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("workspace_attachments")
    .update({ file_name: trimmedName })
    .eq("id", attachmentId);
  if (error) throw new Error(error.message);
}

export async function removeWorkspaceAttachmentRow(row: WorkspaceAttachment): Promise<void> {
  const supabase = createClient();
  const { error: dbErr } = await supabase.from("workspace_attachments").delete().eq("id", row.id);
  if (dbErr) throw new Error(dbErr.message);
  const { error: stErr } = await supabase.storage.from(WORKSPACE_FILES_BUCKET).remove([row.storage_path]);
  if (stErr) {
    /* storage cleanup best-effort */
  }
}

export { ATTACHMENT_DISPLAY_NAME_MAX_LEN, MAX_ATTACHMENT_FILE_BYTES, MAX_ATTACHMENT_SIZE_LABEL, MAX_ATTACHMENTS_PER_MESSAGE };
