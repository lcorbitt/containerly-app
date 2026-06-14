import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { profileDisplayName } from "@shared/author-display-name.ts";
import { stripMessageMarkup } from "@shared/message-markup.ts";
import { isShipmentThreadUnreadForViewer } from "@shared/shipment-thread-unread.ts";
import type { ShipmentActivityEvent } from "@shared/dto/shipment.dto.ts";
import type {
  ContainerWorkspaceLoadResult,
  ContainerWorkspaceSnapshot,
  OrgShipmentMessageThreadsResult,
  ShipmentScopeLoadResult,
  WorkspaceQuickSearchRow,
} from "@shared/dto/workspace.dto.ts";
import {
  buildContainerAttachmentPath,
  buildShipmentAttachmentPath,
  MAX_ATTACHMENT_FILE_BYTES,
  MAX_ATTACHMENT_SIZE_LABEL,
  WORKSPACE_FILES_BUCKET,
} from "@shared/workspace-files.ts";
import { persistShipmentWorkflowStatus } from "@services/shipment/document.service.ts";
import {
  notifyOperatorsCustomerDocumentUploaded,
  notifyOperatorsDraftsPublished,
} from "@services/notification/workflow.service.ts";
import { createServiceClient } from "@services/db.ts";
import { syncActivityEventsForEditedShipmentMessage } from "@services/message/activity-sync.service.ts";
import { recordMessageActivityEvent } from "@services/message/activity.service.ts";
import { notifyOperatorsBolImported } from "@services/notification/in-app-alerts.ts";
import {
  deleteShipmentMessage as deleteShipmentMessageRow,
  getShipmentMessageAuthorForEdit,
  insertWorkspaceShipmentMessage,
  listShipmentMessagesByContainer,
  listShipmentMessagesByContainerIdsFull,
  listShipmentMessagesForImporterThreadIndex,
  listShipmentMessagesForOrgThreadIndex,
  listShipmentScopeShipmentMessages,
  updateShipmentMessage as updateShipmentMessageRow,
} from "@models/shipment_messages.ts";
import {
  listImporterShipmentMessageThreadReadsForUser,
  listShipmentMessageThreadReadsForUser,
  upsertShipmentMessageThreadRead,
} from "@models/shipment_message_thread_reads.ts";

type ShipmentMessage = Record<string, unknown> & {
  id: string;
  author_user_id: string | null;
  author_kind: string;
  author_display_name: string | null;
  created_at: string;
  body: string;
};

type WorkspaceAttachment = Record<string, unknown> & {
  id: string;
  file_name: string;
  uploaded_by: string;
  uploaded_by_kind?: string | null;
  document_type?: string | null;
  document_group?: string | null;
  approval_status?: string | null;
};

type ReportActivity = Record<string, unknown>;
type TrackingRequest = Record<string, unknown>;
type PublicTimelineEvent = Record<string, unknown>;

function mapActivityEventRow(row: Record<string, unknown>): ShipmentActivityEvent {
  return {
    id: row.id as string,
    event_type: row.event_type as string,
    body: row.body as string,
    actor_kind: row.actor_kind as string,
    occurred_at: row.occurred_at as string,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  };
}

function activityEventMatchesContainer(
  event: ShipmentActivityEvent,
  containerId: string,
): boolean {
  if (event.event_type !== "customer_message" && event.event_type !== "operator_message") {
    return false;
  }
  const meta = event.metadata ?? {};
  const scopedContainerId = meta.container_id;
  return typeof scopedContainerId === "string" && scopedContainerId === containerId;
}

export async function loadContainerWorkspaceDataForUser(
  supabase: SupabaseClient,
  input: { containerId: string; organizationId: string },
): Promise<ContainerWorkspaceLoadResult> {
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
      error: "No carrier sync line for this container yet. Enable carrier tracking from the shipment workspace after documents are approved.",
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

  const [{ data: msg }, { data: act }, { data: tev }, attRes, siblingResult, activityRes] = await Promise.all([
    listShipmentMessagesByContainer(supabase, input.containerId),
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
    shipmentIdForSiblings
      ? supabase
          .from("shipment_activity_events")
          .select("id, event_type, body, actor_kind, occurred_at, metadata")
          .eq("shipment_id", shipmentIdForSiblings)
          .in("event_type", ["customer_message", "operator_message"])
          .order("occurred_at", { ascending: true })
      : Promise.resolve({ data: [] as Record<string, unknown>[], error: null }),
  ]);

  const msgList = (msg as ShipmentMessage[]) ?? [];
  const attRows: WorkspaceAttachment[] = attRes.error
    ? []
    : ((attRes.data as WorkspaceAttachment[]) ?? []);

  const authorIds = [
    ...new Set(msgList.map((m) => m.author_user_id).filter((id): id is string => Boolean(id))),
  ];
  const uploaderIds = [...new Set(attRows.map((a) => a.uploaded_by))];
  const profileIds = [...new Set([...authorIds, ...uploaderIds])];

  const nameByUser: Record<string, string> = {};
  const emailByUser: Record<string, string> = {};
  const profileImagePathByUserId: Record<string, string | null> = {};
  if (profileIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, email, full_name, profile_image_path")
      .in("id", profileIds);
    for (const p of profs ?? []) {
      const id = p.id as string;
      const email = (p.email as string | null)?.trim() ?? "";
      if (email) emailByUser[id] = email;
      nameByUser[id] = profileDisplayName({
        full_name: p.full_name as string | null,
        email: p.email as string | null,
      });
      profileImagePathByUserId[id] =
        ((p.profile_image_path as string | null | undefined)?.trim() || null);
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

  const activityEvents = ((activityRes.data as Record<string, unknown>[] | null) ?? [])
    .map(mapActivityEventRow)
    .filter((event) => activityEventMatchesContainer(event, input.containerId));

  return {
    ok: true,
    request: tr as TrackingRequest,
    messages: msgList,
    messageAuthorByUserId: nameByUser,
    messageAuthorEmailByUserId: emailByUser,
    profileImagePathByUserId,
    activity: (act as ReportActivity[]) ?? [],
    activityEvents,
    timeline: [...((tev as PublicTimelineEvent[] | null) ?? [])],
    containerRow,
    bolGroupSiblings,
    attachments: attRows,
    quietAttachmentWarning: attRes.error?.message,
  };
}

export async function fetchWorkspaceQuickSearchForOrg(
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

async function insertMessageActivityEventForUser(
  supabase: SupabaseClient,
  input: {
    shipmentId: string;
    messageId: string;
    body: string;
    authorKind: string;
    authorDisplayName: string | null | undefined;
    authorUserId: string | null;
    containerId?: string | null;
    attachmentCount?: number;
  },
): Promise<void> {
  await recordMessageActivityEvent(supabase, {
    shipmentId: input.shipmentId,
    messageId: input.messageId,
    body: input.body,
    authorKind: input.authorKind,
    authorDisplayName: input.authorDisplayName,
    authorUserId: input.authorUserId,
    containerId: input.containerId,
    attachmentCount: input.attachmentCount,
  });
}

async function resolveContainerShipmentId(
  supabase: SupabaseClient,
  containerId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("containers")
    .select("shipment_id")
    .eq("id", containerId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data?.shipment_id as string | null) ?? null;
}

export async function createWorkspaceStorageSignedUrlQuery(
  supabase: SupabaseClient,
  storagePath: string,
  expiresSec = 3600,
  options?: {
    downloadFileName?: string;
    transform?: { width: number; height: number; quality?: number; resize?: "contain" | "cover" | "fill" };
  },
): Promise<string> {
  const download = options?.downloadFileName?.trim();
  const signOptions = download
    ? { download }
    : options?.transform
      ? { transform: options.transform }
      : undefined;

  const { data, error } = await supabase.storage
    .from(WORKSPACE_FILES_BUCKET)
    .createSignedUrl(storagePath, expiresSec, signOptions);
  if (error || !data?.signedUrl) throw new Error(error?.message ?? "Could not open file");
  return data.signedUrl;
}

export async function createAuthorizedWorkspaceStorageSignedUrlForUser(
  supabase: SupabaseClient,
  userId: string,
  storagePath: string,
  expiresSec = 3600,
  options?: {
    downloadFileName?: string;
    transform?: { width: number; height: number; quality?: number; resize?: "contain" | "cover" | "fill" };
  },
): Promise<string> {
  const { data: att, error: attErr } = await supabase
    .from("workspace_attachments")
    .select("id, organization_id, shipment_id, container_id, is_internal")
    .eq("storage_path", storagePath)
    .maybeSingle();
  if (attErr) throw new Error(attErr.message);
  if (!att) throw new Error("Attachment not found");
  if (att.is_internal) throw new Error("No access to this file");

  let shipmentId = att.shipment_id as string | null;
  if (!shipmentId && att.container_id) {
    const { data: container, error: containerErr } = await supabase
      .from("containers")
      .select("shipment_id")
      .eq("id", att.container_id as string)
      .maybeSingle();
    if (containerErr) throw new Error(containerErr.message);
    shipmentId = (container?.shipment_id as string | null) ?? null;
  }

  const organizationId = att.organization_id as string;
  const { data: member, error: memberErr } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle();
  if (memberErr) throw new Error(memberErr.message);

  let allowed = Boolean(member);
  if (!allowed && shipmentId) {
    const { data: access, error: accessErr } = await supabase
      .from("shipment_customer_access")
      .select("id")
      .eq("shipment_id", shipmentId)
      .eq("customer_user_id", userId)
      .is("revoked_at", null)
      .maybeSingle();
    if (accessErr) throw new Error(accessErr.message);
    allowed = Boolean(access);
  }

  if (!allowed) throw new Error("No access to this file");

  const admin = createServiceClient();
  return createWorkspaceStorageSignedUrlQuery(admin, storagePath, expiresSec, options);
}

export async function updateShipmentMessage(
  supabase: SupabaseClient,
  userId: string,
  messageId: string,
  body: string,
): Promise<ShipmentMessage> {
  const trimmed = body.trim();
  if (!trimmed) {
    throw new Error("Message cannot be empty.");
  }

  const { data: existing, error: fetchErr } = await getShipmentMessageAuthorForEdit(
    supabase,
    messageId,
  );
  if (fetchErr) throw new Error(fetchErr.message);
  if (!existing?.author_user_id || existing.author_user_id !== userId) {
    throw new Error(
      "Could not update this message. It may have been removed, or you can only edit messages you posted.",
    );
  }

  const { data: updated, error } = await updateShipmentMessageRow(supabase, messageId, trimmed);
  if (error) throw new Error(error.message);
  if (!updated) {
    throw new Error(
      "Could not update this message. It may have been removed, or you can only edit messages you posted.",
    );
  }

  try {
    const admin = createServiceClient();
    await syncActivityEventsForEditedShipmentMessage(admin, {
      shipmentMessageId: messageId,
      body: trimmed,
    });
  } catch {
    /* best-effort — activity row updates also trigger realtime */
  }

  return updated as ShipmentMessage;
}

export async function deleteShipmentMessage(
  supabase: SupabaseClient,
  messageId: string,
): Promise<void> {
  const { data: deletedRows, error } = await deleteShipmentMessageRow(supabase, messageId);
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
    shipment_message_id?: string;
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
  if (reportMessageId) insertRow.shipment_message_id = reportMessageId;

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

export async function createContainerMessage(
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
): Promise<{ message: ShipmentMessage; attachmentErrors: string[] }> {
  const { data: selfProf } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .maybeSingle();
  const displayName = profileDisplayName({
    full_name: selfProf?.full_name as string | null,
    email: (selfProf?.email as string | null) ?? userEmail,
  });

  const { data: inserted, error } = await insertWorkspaceShipmentMessage(supabase, {
    container_id: input.containerId,
    shipment_id: null,
    author_user_id: userId,
    author_kind: "member",
    author_display_name: displayName,
    is_internal: input.internalOnly,
    body: input.body,
    parent_message_id: input.replyParentId,
  });
  if (error) throw new Error(error.message);
  if (!inserted) throw new Error("Message was not saved.");
  const message = inserted as ShipmentMessage;

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

  if (!input.internalOnly) {
    const shipmentId = await resolveContainerShipmentId(supabase, input.containerId);
    if (shipmentId) {
      await insertMessageActivityEventForUser(supabase, {
        shipmentId,
        messageId: message.id,
        body: input.body,
        authorKind: message.author_kind,
        authorDisplayName: displayName,
        authorUserId: userId,
        containerId: input.containerId,
        attachmentCount: input.files.length,
      });
    }
  }

  return { message, attachmentErrors };
}

export async function createContainerWorkspaceDocumentsForUser(
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

function updateActivityMetadataFileName(
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
    const updated = updateActivityMetadataFileName(metadata, attachmentId, fileName);
    if (!updated) continue;

    const { error: updateErr } = await supabase
      .from("shipment_activity_events")
      .update({ metadata: updated })
      .eq("id", event.id as string);
    if (updateErr) throw new Error(updateErr.message);
  }
}

export async function removeWorkspaceAttachmentByIdForUser(
  supabase: SupabaseClient,
  attachmentId: string,
): Promise<void> {
  const { data: deletedRows, error } = await supabase
    .from("workspace_attachments")
    .delete()
    .eq("id", attachmentId)
    .select("id");
  if (error) throw new Error(error.message);
  if (!deletedRows?.length) throw new Error("Attachment not found");
}

export async function getShipmentScopeThread(
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

  const { data: containerRows, error: contErr } = await supabase
    .from("containers")
    .select("id")
    .eq("shipment_id", input.shipmentId);
  if (contErr) return { ok: false, error: contErr.message };

  const containerIds = (containerRows ?? []).map((c) => c.id as string);

  const shipmentMsgQuery = listShipmentScopeShipmentMessages(supabase, input.shipmentId);

  const containerMsgQuery =
    containerIds.length > 0
      ? listShipmentMessagesByContainerIdsFull(supabase, containerIds)
      : Promise.resolve({ data: [] as ShipmentMessage[], error: null });

  const [shipmentMsgRes, containerMsgRes, attRes] = await Promise.all([
    shipmentMsgQuery,
    containerMsgQuery,
    supabase
      .from("workspace_attachments")
      .select("*")
      .eq("shipment_id", input.shipmentId)
      .is("container_id", null)
      .order("created_at", { ascending: false }),
  ]);

  if (shipmentMsgRes.error) return { ok: false, error: shipmentMsgRes.error.message };
  if (containerMsgRes.error) return { ok: false, error: containerMsgRes.error.message };

  const msgList = [...((shipmentMsgRes.data as ShipmentMessage[]) ?? []), ...((containerMsgRes.data as ShipmentMessage[]) ?? [])].sort(
    (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at),
  );
  const attRows: WorkspaceAttachment[] = attRes.error
    ? []
    : ((attRes.data as WorkspaceAttachment[]) ?? []);

  const authorIds = [
    ...new Set(msgList.map((m) => m.author_user_id).filter((id): id is string => Boolean(id))),
  ];
  const uploaderIds = [...new Set(attRows.map((a) => a.uploaded_by))];
  const profileIds = [...new Set([...authorIds, ...uploaderIds])];
  const nameByUser: Record<string, string> = {};
  const emailByUser: Record<string, string> = {};
  const profileImagePathByUserId: Record<string, string | null> = {};
  if (profileIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, email, full_name, profile_image_path")
      .in("id", profileIds);
    for (const p of profs ?? []) {
      const id = p.id as string;
      const email = (p.email as string | null)?.trim() ?? "";
      if (email) emailByUser[id] = email;
      nameByUser[id] = profileDisplayName({
        full_name: p.full_name as string | null,
        email: p.email as string | null,
      });
      profileImagePathByUserId[id] =
        ((p.profile_image_path as string | null | undefined)?.trim() || null);
    }
  }

  for (const m of msgList) {
    const uid = m.author_user_id;
    if (!uid || nameByUser[uid]) continue;
    const stored = m.author_display_name?.trim();
    if (stored) {
      nameByUser[uid] = stored;
      continue;
    }
    if (m.author_kind === "customer") {
      nameByUser[uid] = emailByUser[uid] ? profileDisplayName({ email: emailByUser[uid] }) : "Customer";
    }
  }

  return {
    ok: true,
    messages: msgList,
    attachments: attRows,
    messageAuthorByUserId: nameByUser,
    messageAuthorEmailByUserId: emailByUser,
    profileImagePathByUserId,
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
    shipment_message_id?: string;
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
  if (reportMessageId) insertRow.shipment_message_id = reportMessageId;
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

export async function insertShipmentScopeShipmentMessageForUser(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string | null,
  input: {
    organizationId: string;
    shipmentId: string;
    body: string;
    internalOnly: boolean;
    replyParentId: string | null;
  },
): Promise<{ messageId: string; authorKind: "member" | "customer" }> {
  const { data: selfProf } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .maybeSingle();
  const displayName = profileDisplayName({
    full_name: selfProf?.full_name as string | null,
    email: (selfProf?.email as string | null) ?? userEmail,
  });

  const uploaderKind = await resolveShipmentAttachmentUploaderKind(
    supabase,
    input.organizationId,
    input.shipmentId,
    userId,
  );
  const authorKind = uploaderKind === "customer" ? "customer" : "member";
  const isInternal = authorKind === "customer" ? false : input.internalOnly;

  const { data: inserted, error } = await insertWorkspaceShipmentMessage(supabase, {
    shipment_id: input.shipmentId,
    container_id: null,
    author_user_id: userId,
    author_kind: authorKind,
    author_display_name: displayName,
    is_internal: isInternal,
    body: input.body,
    parent_message_id: input.replyParentId,
  });
  if (error) throw new Error(error.message);
  if (!inserted) throw new Error("Message was not saved.");
  return { messageId: (inserted as ShipmentMessage).id, authorKind };
}

export async function createShipmentMessage(
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
  const { data: selfProf } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .maybeSingle();
  const displayName = profileDisplayName({
    full_name: selfProf?.full_name as string | null,
    email: (selfProf?.email as string | null) ?? userEmail,
  });

  const trimmedBody = input.body.trim();
  if (!trimmedBody && input.files.length === 0) {
    throw new Error("Message body or at least one attachment is required.");
  }

  const { messageId, authorKind } = await insertShipmentScopeShipmentMessageForUser(
    supabase,
    userId,
    userEmail,
    {
      organizationId: input.organizationId,
      shipmentId: input.shipmentId,
      body: trimmedBody || " ",
      internalOnly: input.internalOnly,
      replyParentId: input.replyParentId,
    },
  );
  const attachmentErrors: string[] = [];
  for (const file of input.files) {
    try {
      await persistShipmentAttachmentFileServer(supabase, {
        organizationId: input.organizationId,
        shipmentId: input.shipmentId,
        userId,
        file,
        shipmentMessageId: messageId,
      });
    } catch (e) {
      attachmentErrors.push(e instanceof Error ? e.message : "Could not upload an attachment");
    }
  }

  const isPublicMessage = authorKind === "customer" || !input.internalOnly;
  if (isPublicMessage) {
    try {
      await insertMessageActivityEventForUser(supabase, {
        shipmentId: input.shipmentId,
        messageId,
        body: trimmedBody || input.body,
        authorKind,
        authorDisplayName: displayName,
        authorUserId: userId,
        containerId: null,
        attachmentCount: input.files.length,
      });
    } catch {
      /* best-effort — customer activity rows use service role on Edge */
    }
  }

  try {
    await updateShipmentThreadRead(
      supabase,
      userId,
      input.organizationId,
      input.shipmentId,
    );
  } catch {
    /* best-effort */
  }

  return { messageId, attachmentErrors };
}

export async function createShipmentScopeStandaloneFilesForUser(
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
        await notifyOperatorsDraftsPublished(createServiceClient(), {
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
        await notifyOperatorsCustomerDocumentUploaded(createServiceClient(), {
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

  const uploadedGroup = input.documentGroup?.trim().toLowerCase();
  const hasReviewableUpload =
    out.length > 0 &&
    (uploadedGroup === "draft" ||
      uploadedGroup === "revision" ||
      out.some((row) => {
        const g = row.document_group?.trim().toLowerCase();
        return g === "draft" || g === "revision";
      }));
  if (hasReviewableUpload) {
    await persistShipmentWorkflowStatus(supabase, input.shipmentId);
  }

  return out;
}

const ORG_SHIPMENT_THREAD_INDEX_LIMIT = 100;
const ORG_SHIPMENT_MESSAGE_FETCH_LIMIT = 5000;

function resolveThreadAuthorName(
  authorKind: string,
  authorUserId: string | null,
  authorDisplayName: string | null,
  profileNameByUserId: Record<string, string>,
): string {
  if (authorKind === "customer") {
    return authorDisplayName?.trim() || "Customer";
  }
  if (authorUserId && profileNameByUserId[authorUserId]) {
    return profileNameByUserId[authorUserId]!;
  }
  const stored = authorDisplayName?.trim();
  if (stored) return stored;
  return "Team member";
}

function resolveThreadAuthorEmail(
  authorKind: string,
  authorUserId: string | null,
  profileEmailByUserId: Record<string, string>,
): string | null {
  if (authorKind !== "customer" || !authorUserId) return null;
  const email = profileEmailByUserId[authorUserId]?.trim();
  return email || null;
}

export async function updateShipmentThreadRead(
  supabase: SupabaseClient,
  userId: string,
  organizationId: string,
  shipmentId: string,
): Promise<void> {
  const { data: shipment, error: shipmentError } = await supabase
    .from("shipments")
    .select("id")
    .eq("id", shipmentId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (shipmentError) throw new Error(shipmentError.message);
  if (!shipment) throw new Error("Shipment not found.");

  const nowIso = new Date().toISOString();
  const lastReadAt = nowIso;

  const { error } = await upsertShipmentMessageThreadRead(supabase, {
    organization_id: organizationId,
    user_id: userId,
    shipment_id: shipmentId,
    last_read_at: lastReadAt,
    updated_at: nowIso,
  });
  if (error) throw new Error(error.message);
}

export async function listOrgShipmentMessageThreads(
  supabase: SupabaseClient,
  userId: string,
  organizationId: string,
): Promise<OrgShipmentMessageThreadsResult> {
  const { data: msgRows, error } = await listShipmentMessagesForOrgThreadIndex(
    supabase,
    organizationId,
    ORG_SHIPMENT_MESSAGE_FETCH_LIMIT,
  );

  if (error) return { ok: false, error: error.message };

  const containerIds = [
    ...new Set(
      (msgRows ?? [])
        .map((row) => row.container_id as string | null)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const shipmentByContainerId = new Map<string, string>();
  if (containerIds.length > 0) {
    const { data: containers, error: contErr } = await supabase
      .from("containers")
      .select("id, shipment_id")
      .in("id", containerIds);
    if (contErr) return { ok: false, error: contErr.message };
    for (const c of containers ?? []) {
      const sid = c.shipment_id as string | null;
      if (sid) shipmentByContainerId.set(c.id as string, sid);
    }
  }

  const byShipment = new Map<
    string,
    {
      last_message_at: string;
      last_message_preview: string;
      last_author_kind: string;
      last_author_user_id: string | null;
      last_author_display_name: string | null;
      message_count: number;
    }
  >();

  for (const row of msgRows ?? []) {
    const shipmentId =
      (row.shipment_id as string | null) ??
      (row.container_id ? shipmentByContainerId.get(row.container_id as string) : undefined) ??
      null;
    if (!shipmentId) continue;
    const existing = byShipment.get(shipmentId);
    if (existing) {
      existing.message_count += 1;
      continue;
    }
    byShipment.set(shipmentId, {
      last_message_at: row.created_at as string,
      last_message_preview: typeof row.body === "string" ? stripMessageMarkup(row.body).trim() : "",
      last_author_kind: typeof row.author_kind === "string" ? row.author_kind : "",
      last_author_user_id: (row.author_user_id as string | null | undefined) ?? null,
      last_author_display_name: (row.author_display_name as string | null | undefined) ?? null,
      message_count: 1,
    });
  }

  const shipmentIds = [...byShipment.keys()];
  if (shipmentIds.length === 0) {
    return { ok: true, threads: [] };
  }

  const { data: readRows, error: readErr } = await listShipmentMessageThreadReadsForUser(
    supabase,
    organizationId,
    userId,
    shipmentIds,
  );
  if (readErr) return { ok: false, error: readErr.message };

  const lastReadAtByShipmentId = new Map(
    (readRows ?? []).map((row) => [row.shipment_id as string, row.last_read_at as string]),
  );

  const { data: shipments, error: shErr } = await supabase
    .from("shipments")
    .select("id, order_number")
    .eq("organization_id", organizationId)
    .in("id", shipmentIds);

  if (shErr) return { ok: false, error: shErr.message };

  const orderById = new Map(
    (shipments ?? []).map((s) => [s.id as string, (s.order_number as string | null) ?? null]),
  );

  const authorIds = [
    ...new Set(
      [...byShipment.values()]
        .map((agg) => agg.last_author_user_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const profileNameByUserId: Record<string, string> = {};
  const profileEmailByUserId: Record<string, string> = {};
  if (authorIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", authorIds);
    for (const p of profs ?? []) {
      const id = p.id as string;
      profileNameByUserId[id] = profileDisplayName({
        full_name: p.full_name as string | null,
        email: p.email as string | null,
      });
      const email = (p.email as string | null)?.trim() ?? "";
      if (email) profileEmailByUserId[id] = email;
    }
  }

  const threads = [...byShipment.entries()]
    .map(([shipment_id, agg]) => {
      const { last_author_display_name, ...rest } = agg;
      return {
        shipment_id,
        order_number: orderById.get(shipment_id) ?? null,
        ...rest,
        last_author_name: resolveThreadAuthorName(
          agg.last_author_kind,
          agg.last_author_user_id,
          last_author_display_name,
          profileNameByUserId,
        ),
        last_author_email: resolveThreadAuthorEmail(
          agg.last_author_kind,
          agg.last_author_user_id,
          profileEmailByUserId,
        ),
        is_unread: isShipmentThreadUnreadForViewer({
          viewerUserId: userId,
          lastAuthorUserId: agg.last_author_user_id,
          lastMessageAt: agg.last_message_at,
          lastReadAt: lastReadAtByShipmentId.get(shipment_id),
        }),
      };
    })
    .sort((a, b) => Date.parse(b.last_message_at) - Date.parse(a.last_message_at))
    .slice(0, ORG_SHIPMENT_THREAD_INDEX_LIMIT);

  return { ok: true, threads };
}

export async function updateImporterShipmentThreadRead(
  supabase: SupabaseClient,
  userId: string,
  shipmentId: string,
): Promise<void> {
  const { data: shipment, error: shipmentError } = await supabase
    .from("shipments")
    .select("id, organization_id")
    .eq("id", shipmentId)
    .maybeSingle();
  if (shipmentError) throw new Error(shipmentError.message);
  if (!shipment) throw new Error("Shipment not found.");

  const { data: access, error: accessError } = await supabase
    .from("shipment_customer_access")
    .select("id")
    .eq("shipment_id", shipmentId)
    .eq("customer_user_id", userId)
    .is("revoked_at", null)
    .maybeSingle();
  if (accessError) throw new Error(accessError.message);
  if (!access) throw new Error("No access to this shipment.");

  const organizationId = shipment.organization_id as string;
  const nowIso = new Date().toISOString();

  const { error } = await upsertShipmentMessageThreadRead(supabase, {
    organization_id: organizationId,
    user_id: userId,
    shipment_id: shipmentId,
    last_read_at: nowIso,
    updated_at: nowIso,
  });
  if (error) throw new Error(error.message);
}

export async function listImporterShipmentMessageThreads(
  supabase: SupabaseClient,
  userId: string,
): Promise<OrgShipmentMessageThreadsResult> {
  const { data: grants, error: grantErr } = await supabase
    .from("shipment_customer_access")
    .select("shipment_id")
    .eq("customer_user_id", userId)
    .is("revoked_at", null);

  if (grantErr) return { ok: false, error: grantErr.message };

  const allowedShipmentIds = new Set(
    (grants ?? []).map((row) => row.shipment_id as string).filter(Boolean),
  );
  if (allowedShipmentIds.size === 0) {
    return { ok: true, threads: [] };
  }

  const { data: msgRows, error } = await listShipmentMessagesForImporterThreadIndex(
    supabase,
    ORG_SHIPMENT_MESSAGE_FETCH_LIMIT,
  );

  if (error) return { ok: false, error: error.message };

  const containerIds = [
    ...new Set(
      (msgRows ?? [])
        .map((row) => row.container_id as string | null)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const shipmentByContainerId = new Map<string, string>();
  if (containerIds.length > 0) {
    const { data: containers, error: contErr } = await supabase
      .from("containers")
      .select("id, shipment_id")
      .in("id", containerIds);
    if (contErr) return { ok: false, error: contErr.message };
    for (const c of containers ?? []) {
      const sid = c.shipment_id as string | null;
      if (sid) shipmentByContainerId.set(c.id as string, sid);
    }
  }

  const byShipment = new Map<
    string,
    {
      last_message_at: string;
      last_message_preview: string;
      last_author_kind: string;
      last_author_user_id: string | null;
      last_author_display_name: string | null;
      message_count: number;
    }
  >();

  for (const row of msgRows ?? []) {
    const shipmentId =
      (row.shipment_id as string | null) ??
      (row.container_id ? shipmentByContainerId.get(row.container_id as string) : undefined) ??
      null;
    if (!shipmentId || !allowedShipmentIds.has(shipmentId)) continue;

    const existing = byShipment.get(shipmentId);
    if (existing) {
      existing.message_count += 1;
      continue;
    }
    byShipment.set(shipmentId, {
      last_message_at: row.created_at as string,
      last_message_preview: typeof row.body === "string" ? stripMessageMarkup(row.body).trim() : "",
      last_author_kind: typeof row.author_kind === "string" ? row.author_kind : "",
      last_author_user_id: (row.author_user_id as string | null | undefined) ?? null,
      last_author_display_name: (row.author_display_name as string | null | undefined) ?? null,
      message_count: 1,
    });
  }

  const shipmentIds = [...byShipment.keys()];
  if (shipmentIds.length === 0) {
    return { ok: true, threads: [] };
  }

  const { data: readRows, error: readErr } = await listImporterShipmentMessageThreadReadsForUser(
    supabase,
    userId,
    shipmentIds,
  );
  if (readErr) return { ok: false, error: readErr.message };

  const lastReadAtByShipmentId = new Map(
    (readRows ?? []).map((row) => [row.shipment_id as string, row.last_read_at as string]),
  );

  const { data: shipments, error: shErr } = await supabase
    .from("shipments")
    .select("id, order_number, organization_id, organizations(name)")
    .in("id", shipmentIds);

  if (shErr) return { ok: false, error: shErr.message };

  const orderById = new Map<string, string | null>();
  const orgNameById = new Map<string, string | null>();
  const orgIdByShipmentId = new Map<string, string>();
  for (const s of shipments ?? []) {
    const id = s.id as string;
    orderById.set(id, (s.order_number as string | null) ?? null);
    orgIdByShipmentId.set(id, s.organization_id as string);
    const orgJoin = s.organizations as { name?: string | null } | null;
    orgNameById.set(id, orgJoin?.name?.trim() ?? null);
  }

  const authorIds = [
    ...new Set(
      [...byShipment.values()]
        .map((agg) => agg.last_author_user_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const profileNameByUserId: Record<string, string> = {};
  const profileEmailByUserId: Record<string, string> = {};
  if (authorIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", authorIds);
    for (const p of profs ?? []) {
      const id = p.id as string;
      profileNameByUserId[id] = profileDisplayName({
        full_name: p.full_name as string | null,
        email: p.email as string | null,
      });
      const email = (p.email as string | null)?.trim() ?? "";
      if (email) profileEmailByUserId[id] = email;
    }
  }

  const threads = [...byShipment.entries()]
    .map(([shipment_id, agg]) => {
      const { last_author_display_name, ...rest } = agg;
      return {
        shipment_id,
        order_number: orderById.get(shipment_id) ?? null,
        organization_id: orgIdByShipmentId.get(shipment_id) ?? null,
        organization_name: orgNameById.get(shipment_id) ?? null,
        ...rest,
        last_author_name: resolveThreadAuthorName(
          agg.last_author_kind,
          agg.last_author_user_id,
          last_author_display_name,
          profileNameByUserId,
        ),
        last_author_email: resolveThreadAuthorEmail(
          agg.last_author_kind,
          agg.last_author_user_id,
          profileEmailByUserId,
        ),
        is_unread: isShipmentThreadUnreadForViewer({
          viewerUserId: userId,
          lastAuthorUserId: agg.last_author_user_id,
          lastMessageAt: agg.last_message_at,
          lastReadAt: lastReadAtByShipmentId.get(shipment_id),
        }),
      };
    })
    .sort((a, b) => Date.parse(b.last_message_at) - Date.parse(a.last_message_at))
    .slice(0, ORG_SHIPMENT_THREAD_INDEX_LIMIT);

  return { ok: true, threads };
}


export async function runBolImportedNotification(input: {
  organizationId: string;
  shipmentId: string;
  actorUserId: string;
  billOfLading: string;
  containerCount: number;
}): Promise<void> {
  await notifyOperatorsBolImported(createServiceClient(), {
    organizationId: input.organizationId,
    shipmentId: input.shipmentId,
    actorUserId: input.actorUserId,
    billOfLading: input.billOfLading,
    containerCount: input.containerCount,
  });
}
