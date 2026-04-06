import { createClient } from "@/lib/supabase/client";
import { profileDisplayName } from "@/lib/author-display-name";
import {
  ATTACHMENT_DISPLAY_NAME_MAX_LEN,
  buildContainerAttachmentPath,
  MAX_ATTACHMENT_FILE_BYTES,
  MAX_ATTACHMENT_SIZE_LABEL,
  WORKSPACE_FILES_BUCKET,
} from "@/lib/workspace-files";
import { createWorkspaceStorageSignedUrl } from "@/services/workspace-storage.service";
import type { ReportActivity, ReportMessage, TrackingRequest, WorkspaceAttachment } from "@/types/database";
import type { PublicTimelineEvent } from "@/types/public-report";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ContainerWorkspaceSnapshot = {
  shipment_id: string | null;
  status: string | null;
  carrier: string | null;
  location: Record<string, unknown> | null;
  last_synced_at: string | null;
  enrichment: Record<string, unknown> | null;
};

export type ContainerWorkspaceLoadResult =
  | { ok: false; error: string; quietAttachmentWarning?: string }
  | {
      ok: true;
      request: TrackingRequest;
      messages: ReportMessage[];
      messageAuthorByUserId: Record<string, string>;
      activity: ReportActivity[];
      timeline: PublicTimelineEvent[];
      containerRow: ContainerWorkspaceSnapshot;
      bolGroupSiblings: { id: string; container_number: string }[];
      attachments: WorkspaceAttachment[];
      quietAttachmentWarning?: string;
    };

export async function loadContainerWorkspaceData(input: {
  containerId: string;
  organizationId: string;
}): Promise<ContainerWorkspaceLoadResult> {
  const supabase = createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) {
    return { ok: false, error: "Not signed in" };
  }

  const { data: cRow, error: cErr } = await supabase
    .from("containers")
    .select("id, shipment_id, status, carrier, location, last_synced_at, enrichment")
    .eq("id", input.containerId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();

  if (cErr) {
    return { ok: false, error: cErr.message };
  }
  if (!cRow) {
    return { ok: false, error: "Container not found in this organization." };
  }

  const { data: tr, error: trErr } = await supabase
    .from("tracking_requests")
    .select("*")
    .eq("container_id", input.containerId)
    .eq("organization_id", input.organizationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (trErr) {
    return { ok: false, error: trErr.message };
  }
  if (!tr) {
    return {
      ok: false,
      error: "No tracking line for this container yet. Create one from Track or a shipment import.",
    };
  }

  const shipmentIdForSiblings = typeof cRow.shipment_id === "string" ? cRow.shipment_id : null;

  const siblingQuery =
    shipmentIdForSiblings && input.organizationId
      ? supabase
          .from("containers")
          .select("id, container_number")
          .eq("shipment_id", shipmentIdForSiblings)
          .eq("organization_id", input.organizationId)
          .neq("id", input.containerId)
          .order("container_number", { ascending: true })
      : Promise.resolve({ data: [] as { id: string; container_number: string }[], error: null });

  const [{ data: msg }, { data: act }, { data: tev }, attRes, siblingResult] = await Promise.all([
    supabase
      .from("report_messages")
      .select("*")
      .eq("container_id", input.containerId)
      .order("created_at", { ascending: true }),
    supabase
      .from("report_activity")
      .select("*")
      .eq("container_id", input.containerId)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("tracking_events")
      .select(
        "id, event_type, status, location, occurred_at, created_at, container_id, tracking_request_id, raw_payload",
      )
      .eq("container_id", input.containerId)
      .order("occurred_at", { ascending: true })
      .limit(100),
    supabase
      .from("workspace_attachments")
      .select("*")
      .eq("container_id", input.containerId)
      .order("created_at", { ascending: false }),
    siblingQuery,
  ]);

  const msgList = (msg as ReportMessage[]) ?? [];
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
      .select("id, email, full_name, profile_image_path")
      .in("id", profileIds);
    for (const p of profs ?? []) {
      const id = p.id as string;
      nameByUser[id] = profileDisplayName({
        full_name: p.full_name as string | null,
        email: p.email as string | null,
      });
    }
  }

  const sib = siblingResult as {
    data: { id: string; container_number: string }[] | null;
    error: { message: string } | null;
  };
  const srows = sib.data;
  const bolGroupSiblings =
    !sib.error && Array.isArray(srows)
      ? srows.map((r) => ({
          id: r.id,
          container_number: r.container_number,
        }))
      : [];

  const containerRow: ContainerWorkspaceSnapshot = {
    shipment_id: typeof cRow.shipment_id === "string" ? cRow.shipment_id : null,
    status: (cRow.status as string | null) ?? null,
    carrier: (cRow.carrier as string | null) ?? null,
    location: (cRow.location as Record<string, unknown> | null) ?? null,
    last_synced_at: (cRow.last_synced_at as string | null) ?? null,
    enrichment:
      cRow.enrichment && typeof cRow.enrichment === "object"
        ? (cRow.enrichment as Record<string, unknown>)
        : null,
  };

  return {
    ok: true,
    request: tr as TrackingRequest,
    messages: msgList,
    messageAuthorByUserId: nameByUser,
    activity: (act as ReportActivity[]) ?? [],
    timeline: [...(tev as PublicTimelineEvent[] | null) ?? []],
    containerRow,
    bolGroupSiblings,
    attachments: attRows,
    quietAttachmentWarning: attRes.error?.message,
  };
}

async function persistContainerAttachmentFile(
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

export async function deleteContainerReportMessage(input: { messageId: string }): Promise<void> {
  const supabase = createClient();
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
}

export async function postContainerWorkspaceMessage(input: {
  containerId: string;
  organizationId: string;
  body: string;
  internalOnly: boolean;
  replyParentId: string | null;
  files: File[];
}): Promise<{ message: ReportMessage; attachmentErrors: string[] }> {
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
      container_id: input.containerId,
      shipment_id: null,
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
  const message = inserted as ReportMessage;

  const attachmentErrors: string[] = [];
  for (const file of input.files) {
    try {
      await persistContainerAttachmentFile(supabase, {
        organizationId: input.organizationId,
        containerId: input.containerId,
        userId: u.user.id,
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

export async function uploadContainerWorkspaceDocuments(input: {
  containerId: string;
  organizationId: string;
  files: File[];
  isInternal: boolean;
}): Promise<{ inserted: WorkspaceAttachment[]; errors: string[] }> {
  const supabase = createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");

  const inserted: WorkspaceAttachment[] = [];
  const errors: string[] = [];
  for (const file of input.files) {
    try {
      const row = await persistContainerAttachmentFile(supabase, {
        organizationId: input.organizationId,
        containerId: input.containerId,
        userId: u.user.id,
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

export async function openContainerWorkspaceAttachmentSignedUrl(storagePath: string): Promise<string> {
  return createWorkspaceStorageSignedUrl(storagePath, 3600);
}

export async function renameContainerWorkspaceAttachment(input: {
  attachmentId: string;
  fileName: string;
}): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("workspace_attachments")
    .update({ file_name: input.fileName })
    .eq("id", input.attachmentId);
  if (error) throw new Error(error.message);
}

export async function removeContainerWorkspaceAttachment(input: {
  attachmentId: string;
  storagePath: string;
}): Promise<{ storageCleanupIncomplete: boolean }> {
  const supabase = createClient();
  const { error: dbErr } = await supabase.from("workspace_attachments").delete().eq("id", input.attachmentId);
  if (dbErr) throw new Error(dbErr.message);
  const { error: stErr } = await supabase.storage.from(WORKSPACE_FILES_BUCKET).remove([input.storagePath]);
  return { storageCleanupIncomplete: Boolean(stErr) };
}

