import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { profileDisplayName } from "@/utils/author-display-name";
import type { ReportMessage, WorkspaceAttachment } from "@/types/database";
import type { OrgShipmentMessageThreadsResult, ShipmentScopeLoadResult } from "@/types/workspace-load";
import {
  buildContainerAttachmentPath,
  buildShipmentAttachmentPath,
  MAX_ATTACHMENT_FILE_BYTES,
  MAX_ATTACHMENT_SIZE_LABEL,
  WORKSPACE_FILES_BUCKET,
} from "@/utils/workspace-files";
import {
  runCustomerDocumentUploadNotification,
  runOperatorDraftsPublishedNotification,
  runOperatorShipmentMessageNotifications,
} from "@/services/notification.server";

export async function createWorkspaceStorageSignedUrlQuery(
  supabase: SupabaseClient,
  storagePath: string,
  expiresSec = 3600,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(WORKSPACE_FILES_BUCKET)
    .createSignedUrl(storagePath, expiresSec);
  if (error || !data?.signedUrl) throw new Error(error?.message ?? "Could not open file");
  return data.signedUrl;
}

export async function deleteReportMessageByIdForUser(
  supabase: SupabaseClient,
  messageId: string,
): Promise<void> {
  const { data: deletedRows, error } = await supabase
    .from("report_messages")
    .delete()
    .eq("id", messageId)
    .select("id");
  if (error) throw new Error(error.message);
  if (!deletedRows?.length) {
    throw new Error(
      "Could not delete this message. It may have already been removed, or you can only delete messages you posted.",
    );
  }
}

async function persistContainerAttachmentFileServer(
  supabase: SupabaseClient,
  args: {
    organizationId: string;
    containerId: string;
    userId: string;
    file: File;
    reportMessageId: string | null;
    isInternal: boolean;
  },
): Promise<WorkspaceAttachment> {
  const { organizationId, containerId, userId, file, reportMessageId, isInternal } = args;
  if (file.size > MAX_ATTACHMENT_FILE_BYTES) {
    throw new Error(`${file.name} is too large (max ${MAX_ATTACHMENT_SIZE_LABEL})`);
  }
  const { path } = buildContainerAttachmentPath(organizationId, containerId, file);
  const { error: upErr } = await supabase.storage
    .from(WORKSPACE_FILES_BUCKET)
    .upload(path, file, {
      contentType: file.type || undefined,
      upsert: false,
    });
  if (upErr) throw new Error(upErr.message);

  const insertRow: {
    organization_id: string;
    container_id: string;
    shipment_id: null;
    storage_path: string;
    file_name: string;
    content_type: string | null;
    file_size_bytes: number;
    uploaded_by: string;
    is_internal: boolean;
    report_message_id?: string;
  } = {
    organization_id: organizationId,
    container_id: containerId,
    shipment_id: null,
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

export async function postContainerWorkspaceMessageForUser(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string | null,
  input: {
    organizationId: string;
    containerId: string;
    body: string;
    internalOnly: boolean;
    replyParentId: string | null;
    files: File[];
  },
): Promise<{ message: ReportMessage; attachmentErrors: string[] }> {
  const { data: selfProf } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .maybeSingle();
  const displayName = profileDisplayName({
    full_name: selfProf?.full_name as string | null,
    email: (selfProf?.email as string | null) ?? userEmail,
  });

  const { data: inserted, error } = await supabase
    .from("report_messages")
    .insert({
      container_id: input.containerId,
      shipment_id: null,
      author_user_id: userId,
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
  const message = inserted as ReportMessage;

  const attachmentErrors: string[] = [];
  for (const file of input.files) {
    try {
      await persistContainerAttachmentFileServer(supabase, {
        organizationId: input.organizationId,
        containerId: input.containerId,
        userId,
        file,
        reportMessageId: message.id,
        isInternal: input.internalOnly,
      });
    } catch (e) {
      attachmentErrors.push(e instanceof Error ? e.message : "Could not upload an attachment");
    }
  }

  return { message, attachmentErrors };
}

export async function uploadContainerWorkspaceDocumentsForUser(
  supabase: SupabaseClient,
  userId: string,
  input: { organizationId: string; containerId: string; files: File[]; isInternal: boolean },
): Promise<{ inserted: WorkspaceAttachment[]; errors: string[] }> {
  const inserted: WorkspaceAttachment[] = [];
  const errors: string[] = [];
  for (const file of input.files) {
    try {
      const row = await persistContainerAttachmentFileServer(supabase, {
        organizationId: input.organizationId,
        containerId: input.containerId,
        userId,
        file,
        reportMessageId: null,
        isInternal: input.isInternal,
      });
      inserted.push(row);
    } catch (e) {
      errors.push(e instanceof Error ? e.message : "Upload failed");
    }
  }
  return { inserted, errors };
}

export async function renameWorkspaceAttachmentFileNameForUser(
  supabase: SupabaseClient,
  attachmentId: string,
  fileName: string,
): Promise<void> {
  const { data: attachment, error: fetchErr } = await supabase
    .from("workspace_attachments")
    .select("shipment_id")
    .eq("id", attachmentId)
    .maybeSingle();
  if (fetchErr) throw new Error(fetchErr.message);
  if (!attachment?.shipment_id) throw new Error("Attachment not found");

  const { error } = await supabase
    .from("workspace_attachments")
    .update({ file_name: fileName })
    .eq("id", attachmentId);
  if (error) throw new Error(error.message);

  await syncActivityEventAttachmentDisplayNames(
    supabase,
    attachment.shipment_id as string,
    attachmentId,
    fileName,
  );
}

function patchActivityMetadataFileName(
  metadata: Record<string, unknown>,
  attachmentId: string,
  fileName: string,
): Record<string, unknown> | null {
  let changed = false;
  const next: Record<string, unknown> = { ...metadata };

  if (next.attachment_id === attachmentId) {
    next.file_name = fileName;
    changed = true;
  }

  if (Array.isArray(next.documents)) {
    next.documents = next.documents.map((entry) => {
      if (!entry || typeof entry !== "object") return entry;
      const row = entry as Record<string, unknown>;
      if (row.attachment_id !== attachmentId) return entry;
      changed = true;
      return { ...row, file_name: fileName };
    });
  }

  return changed ? next : null;
}

async function syncActivityEventAttachmentDisplayNames(
  supabase: SupabaseClient,
  shipmentId: string,
  attachmentId: string,
  fileName: string,
): Promise<void> {
  const { data: events, error } = await supabase
    .from("shipment_activity_events")
    .select("id, metadata")
    .eq("shipment_id", shipmentId);
  if (error) throw new Error(error.message);

  for (const event of events ?? []) {
    const metadata = (event.metadata as Record<string, unknown> | null) ?? {};
    const patched = patchActivityMetadataFileName(metadata, attachmentId, fileName);
    if (!patched) continue;

    const { error: updateErr } = await supabase
      .from("shipment_activity_events")
      .update({ metadata: patched })
      .eq("id", event.id as string);
    if (updateErr) throw new Error(updateErr.message);
  }
}

export async function removeWorkspaceAttachmentByIdForUser(
  supabase: SupabaseClient,
  attachmentId: string,
): Promise<{ storageCleanupIncomplete: boolean }> {
  const { data: row, error: fErr } = await supabase
    .from("workspace_attachments")
    .select("storage_path")
    .eq("id", attachmentId)
    .maybeSingle();
  if (fErr) throw new Error(fErr.message);
  const storagePath = row?.storage_path as string | undefined;
  if (!storagePath) throw new Error("Attachment not found");

  const { error: dbErr } = await supabase.from("workspace_attachments").delete().eq("id", attachmentId);
  if (dbErr) throw new Error(dbErr.message);

  const { error: stErr } = await supabase.storage.from(WORKSPACE_FILES_BUCKET).remove([storagePath]);
  return { storageCleanupIncomplete: Boolean(stErr) };
}

export async function loadShipmentScopeThreadForUser(
  supabase: SupabaseClient,
  userId: string,
  input: { organizationId: string; shipmentId: string },
): Promise<ShipmentScopeLoadResult> {
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
    currentUserId: userId,
  };
}

async function resolveShipmentAttachmentUploaderKind(
  supabase: SupabaseClient,
  organizationId: string,
  shipmentId: string,
  userId: string,
): Promise<"operator" | "customer"> {
  const { data: member } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle();
  if (member) return "operator";

  const { data: access } = await supabase
    .from("shipment_customer_access")
    .select("id")
    .eq("shipment_id", shipmentId)
    .eq("customer_user_id", userId)
    .is("revoked_at", null)
    .maybeSingle();
  if (access) return "customer";

  return "operator";
}

async function persistShipmentAttachmentFileServer(
  supabase: SupabaseClient,
  args: {
    organizationId: string;
    shipmentId: string;
    userId: string;
    file: File;
    reportMessageId: string | null;
    documentType?: string | null;
    documentGroup?: string | null;
  },
): Promise<WorkspaceAttachment> {
  const { organizationId, shipmentId, userId, file, reportMessageId, documentType, documentGroup } = args;
  const uploadedByKind = await resolveShipmentAttachmentUploaderKind(
    supabase,
    organizationId,
    shipmentId,
    userId,
  );
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
    uploaded_by_kind: "operator" | "customer";
    report_message_id?: string;
    document_type?: string | null;
    document_group?: string | null;
    approval_status?: string | null;
  } = {
    organization_id: organizationId,
    shipment_id: shipmentId,
    container_id: null,
    is_internal: false,
    uploaded_by_kind: uploadedByKind,
    storage_path: path,
    file_name: file.name,
    content_type: file.type || null,
    file_size_bytes: file.size,
    uploaded_by: userId,
  };
  if (reportMessageId) insertRow.report_message_id = reportMessageId;
  if (documentType) insertRow.document_type = documentType;
  if (documentGroup) {
    insertRow.document_group = documentGroup;
    if (documentGroup === "draft" || documentGroup === "revision") {
      insertRow.approval_status = "pending";
    }
  }

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

export async function insertShipmentScopeReportMessageForUser(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string | null,
  input: {
    shipmentId: string;
    body: string;
    internalOnly: boolean;
    replyParentId: string | null;
  },
): Promise<string> {
  const { data: selfProf } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .maybeSingle();
  const displayName = profileDisplayName({
    full_name: selfProf?.full_name as string | null,
    email: (selfProf?.email as string | null) ?? userEmail,
  });

  const { data: inserted, error } = await supabase
    .from("report_messages")
    .insert({
      shipment_id: input.shipmentId,
      container_id: null,
      author_user_id: userId,
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

export async function postShipmentScopeMessageWithAttachmentsForUser(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string | null,
  input: {
    organizationId: string;
    shipmentId: string;
    body: string;
    internalOnly: boolean;
    replyParentId: string | null;
    files: File[];
  },
): Promise<{ messageId: string; attachmentErrors: string[] }> {
  const messageId = await insertShipmentScopeReportMessageForUser(supabase, userId, userEmail, {
    shipmentId: input.shipmentId,
    body: input.body,
    internalOnly: input.internalOnly,
    replyParentId: input.replyParentId,
  });
  const attachmentErrors: string[] = [];
  for (const file of input.files) {
    try {
      await persistShipmentAttachmentFileServer(supabase, {
        organizationId: input.organizationId,
        shipmentId: input.shipmentId,
        userId,
        file,
        reportMessageId: messageId,
      });
    } catch (e) {
      attachmentErrors.push(e instanceof Error ? e.message : "Could not upload an attachment");
    }
  }
  try {
    await runOperatorShipmentMessageNotifications({
      organizationId: input.organizationId,
      shipmentId: input.shipmentId,
      actorUserId: userId,
      body: input.body,
      internalOnly: input.internalOnly,
    });
  } catch {
    /* best-effort */
  }

  return { messageId, attachmentErrors };
}

export async function uploadShipmentScopeStandaloneFilesForUser(
  supabase: SupabaseClient,
  userId: string,
  input: {
    organizationId: string;
    shipmentId: string;
    files: File[];
    documentType?: string | null;
    documentGroup?: string | null;
  },
): Promise<WorkspaceAttachment[]> {
  const out: WorkspaceAttachment[] = [];
  for (const file of input.files) {
    const inserted = await persistShipmentAttachmentFileServer(supabase, {
      organizationId: input.organizationId,
      shipmentId: input.shipmentId,
      userId,
      file,
      reportMessageId: null,
      documentType: input.documentType,
      documentGroup: input.documentGroup,
    });
    out.push(inserted);
  }

  if (out.length > 0 && input.documentGroup) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .maybeSingle();
    const operatorName = profileDisplayName({
      full_name: profile?.full_name as string | null,
      email: profile?.email as string | null,
    });

    const group = input.documentGroup.trim().toLowerCase();
    const groupLabel =
      group === "original" ? "Original document" : group === "revision" ? "Revision document" : "Draft document";
    const groupPlural =
      group === "original"
        ? "Original documents"
        : group === "revision"
          ? "Revision documents"
          : "Draft documents";
    const body =
      out.length === 1
        ? `${groupLabel} uploaded by ${operatorName}`
        : `${out.length} ${groupPlural.toLowerCase()} uploaded by ${operatorName}`;

    const sharedDocumentType = input.documentType?.trim() || null;
    const documents = out.map((inserted) => ({
      attachment_id: inserted.id,
      file_name: inserted.file_name,
      document_type: inserted.document_type ?? sharedDocumentType,
      document_group: inserted.document_group ?? input.documentGroup,
      approval_status: inserted.approval_status ?? "pending",
    }));

    const metadata: Record<string, unknown> = {
      file_count: out.length,
      attachment_ids: out.map((row) => row.id),
      document_type: sharedDocumentType,
      document_group: input.documentGroup,
      approval_status: "pending",
      documents,
    };

    if (out.length === 1) {
      metadata.file_name = out[0]!.file_name;
      metadata.attachment_id = out[0]!.id;
    }

    const { error: activityErr } = await supabase.from("shipment_activity_events").insert({
      shipment_id: input.shipmentId,
      event_type: "drafts_attached",
      body,
      actor_kind: "operator",
      actor_user_id: userId,
      metadata,
    });
    if (activityErr) {
      throw new Error(activityErr.message);
    }

    const draftGroup = input.documentGroup?.trim().toLowerCase();
    if (draftGroup === "draft" || draftGroup === "revision") {
      try {
        await runOperatorDraftsPublishedNotification({
          organizationId: input.organizationId,
          shipmentId: input.shipmentId,
          actorUserId: userId,
          fileCount: out.length,
        });
      } catch {
        /* best-effort */
      }
    }
  }

  const customerUploads = out.filter((row) => row.uploaded_by_kind === "customer");
  for (const row of customerUploads) {
    const docGroup = row.document_group?.trim().toLowerCase();
    if (docGroup === "draft" || docGroup === "revision") {
      try {
        await runCustomerDocumentUploadNotification({
          organizationId: input.organizationId,
          shipmentId: input.shipmentId,
          customerUserId: userId,
          fileName: row.file_name,
        });
      } catch {
        /* best-effort */
      }
    }
  }

  return out;
}

const ORG_SHIPMENT_THREAD_INDEX_LIMIT = 100;
const ORG_SHIPMENT_MESSAGE_FETCH_LIMIT = 5000;

export async function loadOrgShipmentMessageThreadsForUser(
  supabase: SupabaseClient,
  userId: string,
  organizationId: string,
): Promise<OrgShipmentMessageThreadsResult> {
  const { data: msgRows, error } = await supabase
    .from("report_messages")
    .select("shipment_id, body, author_kind, author_user_id, created_at")
    .eq("organization_id", organizationId)
    .not("shipment_id", "is", null)
    .is("container_id", null)
    .eq("is_internal", false)
    .order("created_at", { ascending: false })
    .limit(ORG_SHIPMENT_MESSAGE_FETCH_LIMIT);

  if (error) return { ok: false, error: error.message };

  const byShipment = new Map<
    string,
    {
      last_message_at: string;
      last_message_preview: string;
      last_author_kind: string;
      last_author_user_id: string | null;
      message_count: number;
    }
  >();

  for (const row of msgRows ?? []) {
    const shipmentId = row.shipment_id as string | null;
    if (!shipmentId) continue;
    const existing = byShipment.get(shipmentId);
    if (existing) {
      existing.message_count += 1;
      continue;
    }
    byShipment.set(shipmentId, {
      last_message_at: row.created_at as string,
      last_message_preview: typeof row.body === "string" ? row.body.trim() : "",
      last_author_kind: typeof row.author_kind === "string" ? row.author_kind : "",
      last_author_user_id: (row.author_user_id as string | null | undefined) ?? null,
      message_count: 1,
    });
  }

  const shipmentIds = [...byShipment.keys()];
  if (shipmentIds.length === 0) {
    return { ok: true, threads: [] };
  }

  const { data: shipments, error: shErr } = await supabase
    .from("shipments")
    .select("id, order_number")
    .eq("organization_id", organizationId)
    .in("id", shipmentIds);

  if (shErr) return { ok: false, error: shErr.message };

  const orderById = new Map(
    (shipments ?? []).map((s) => [s.id as string, (s.order_number as string | null) ?? null]),
  );

  const threads = [...byShipment.entries()]
    .map(([shipment_id, agg]) => ({
      shipment_id,
      order_number: orderById.get(shipment_id) ?? null,
      ...agg,
    }))
    .sort((a, b) => Date.parse(b.last_message_at) - Date.parse(a.last_message_at))
    .slice(0, ORG_SHIPMENT_THREAD_INDEX_LIMIT);

  return { ok: true, threads };
}

