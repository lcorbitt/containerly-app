import { createClient } from "@/lib/supabase/client";
import { profileDisplayName } from "@/utils/author-display-name";
import { collectMessageSubtreeIds } from "@/utils/report-message-tree";
import {
  ATTACHMENT_DISPLAY_NAME_MAX_LEN,
  buildContainerAttachmentPath,
  buildShipmentAttachmentPath,
  MAX_ATTACHMENT_FILE_BYTES,
  MAX_ATTACHMENT_SIZE_LABEL,
  MAX_ATTACHMENTS_PER_MESSAGE,
  WORKSPACE_FILES_BUCKET,
} from "@/utils/workspace-files";
import type { ReportActivity, ReportMessage, TrackingRequest, WorkspaceAttachment } from "@/types/database";
import type { PublicTimelineEvent } from "@/types/public-report";
import type { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Storage signed URL
// ---------------------------------------------------------------------------

export async function createWorkspaceStorageSignedUrl(
  storagePath: string,
  expiresSec = 3600,
): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(WORKSPACE_FILES_BUCKET)
    .createSignedUrl(storagePath, expiresSec);
  if (error || !data?.signedUrl) throw new Error(error?.message ?? "Could not open file");
  return data.signedUrl;
}

// ---------------------------------------------------------------------------
// Container workspace
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Shipment-scope workspace thread
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Workspace quick search
// ---------------------------------------------------------------------------

export type WorkspaceQuickSearchRow = {
  kind: string;
  id: string;
  title: string;
  subtitle: string | null;
  path: string;
};

export async function fetchWorkspaceQuickSearch(
  supabase: SupabaseClient,
  args: { organizationId: string; query: string; limit?: number },
): Promise<WorkspaceQuickSearchRow[]> {
  const q = args.query.trim();
  if (q.length < 2) return [];

  const { data, error } = await supabase.rpc("workspace_quick_search", {
    p_organization_id: args.organizationId,
    p_query: q,
    p_limit: args.limit ?? 8,
  });

  if (error) throw new Error(error.message);

  const rows = (data as WorkspaceQuickSearchRow[] | null) ?? [];
  return rows.map((r) => ({
    kind: r.kind,
    id: r.id,
    title: r.title,
    subtitle: r.subtitle,
    path: r.path.startsWith("/") ? r.path : `/${r.path}`,
  }));
}
