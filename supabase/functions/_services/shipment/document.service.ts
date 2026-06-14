import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { listContainersForShipment } from "@models/containers.ts";
import { insertShipmentActivityEvent } from "@models/shipment_activity_events.ts";
import { notifyForShipmentActivityEvent } from "@services/shipment/activity/notifications.service.ts";
import { fetchActiveAccessId } from "@models/shipment_customer_access.ts";
import { fetchShipmentAssignee, updateShipmentCommercial } from "@models/shipments.ts";
import { fetchOrganizationForPortal } from "@models/organizations.ts";
import {
  fetchWorkspaceAttachmentById,
  listCustomerVisibleDraftAttachments,
  updateWorkspaceAttachmentReview,
} from "@models/workspace_attachments.ts";
import {
  notifyOperatorsDocumentRejected,
  notifyOperatorsDocumentsApproved,
  notifyOperatorsDraftsPublished,
} from "@services/notification/workflow.service.ts";
import type {
  ReviewShipmentDocumentBody,
  ReviewShipmentDocumentResponse,
  ShipmentWorkflowStatus,
} from "@shared/dto/logistics.dto.ts";

type Err = { ok: false; status: number; error: string };

function formatActivityDate(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(-2)}`;
}

async function insertActivityEventOrFail(
  admin: SupabaseClient | null,
  row: Parameters<typeof insertShipmentActivityEvent>[1],
): Promise<Err | null> {
  if (!admin) {
    return { ok: false, status: 500, error: "Activity logging unavailable" };
  }
  const { error } = await insertShipmentActivityEvent(admin, row);
  if (error) {
    return { ok: false, status: 500, error: error.message };
  }
  return null;
}

async function recomputeWorkflowStatus(
  client: SupabaseClient,
  shipmentId: string,
  containerIds: string[],
): Promise<ShipmentWorkflowStatus> {
  const { data: docs, error } = await listCustomerVisibleDraftAttachments(
    client,
    shipmentId,
    containerIds,
  );
  if (error) throw error;

  const reviewable = (docs ?? []).filter(
    (d) =>
      d.document_group === "draft" || d.document_group === "revision",
  );

  if (reviewable.length === 0) return "pending_drafts";

  const anyRejected = reviewable.some((d) => d.approval_status === "rejected");
  if (anyRejected) return "rejected";

  const allApproved = reviewable.every((d) => d.approval_status === "approved");
  if (allApproved) return "approved";

  return "awaiting_review";
}

export async function updateShipmentDocument(
  userClient: SupabaseClient,
  admin: SupabaseClient | null,
  userId: string,
  input: ReviewShipmentDocumentBody,
): Promise<{ ok: true } & ReviewShipmentDocumentResponse | Err> {
  const attachmentId = input.attachment_id?.trim();
  const shipmentId = input.shipment_id?.trim();
  if (!attachmentId || !shipmentId) {
    return { ok: false, status: 400, error: "attachment_id and shipment_id required" };
  }
  if (input.action !== "approve" && input.action !== "reject") {
    return { ok: false, status: 400, error: "action must be approve or reject" };
  }
  if (input.action === "reject" && !input.rejection_reason?.trim()) {
    return { ok: false, status: 400, error: "rejection_reason required when rejecting" };
  }

  const db = admin ?? userClient;

  const { data: accessId, error: accErr } = await fetchActiveAccessId(userClient, shipmentId, userId);
  if (accErr) throw accErr;
  if (!accessId) return { ok: false, status: 403, error: "No access to this shipment" };

  const { data: att, error: attErr } = await fetchWorkspaceAttachmentById(db, attachmentId);
  if (attErr) throw attErr;
  if (!att) return { ok: false, status: 404, error: "Attachment not found" };

  const attShipmentId = att.shipment_id as string | null;
  const attContainerId = att.container_id as string | null;
  if (attShipmentId !== shipmentId && !attContainerId) {
    return { ok: false, status: 400, error: "Attachment does not belong to this shipment" };
  }
  if (att.is_internal) {
    return { ok: false, status: 400, error: "Internal documents cannot be reviewed" };
  }
  if (!att.document_group || att.document_group === "original") {
    return { ok: false, status: 400, error: "Only draft or revision documents can be reviewed" };
  }

  const approvalStatus = input.action === "approve" ? "approved" : "rejected";
  const { data: updated, error: upErr } = await updateWorkspaceAttachmentReview(db, attachmentId, {
    approval_status: approvalStatus,
    rejection_reason: input.action === "reject" ? input.rejection_reason!.trim() : null,
    reviewed_at: new Date().toISOString(),
    reviewed_by_user_id: userId,
  });
  if (upErr) return { ok: false, status: 500, error: upErr.message };

  const { data: containers } = await listContainersForShipment(db, shipmentId);
  const containerIds = (containers ?? []).map((c) => c.id as string);
  const workflowStatus = await recomputeWorkflowStatus(db, shipmentId, containerIds);

  await updateShipmentCommercial(db, shipmentId, { workflow_status: workflowStatus });

  const { data: shipRow } = await fetchShipmentAssignee(db, shipmentId);
  const { data: orgRow } = await fetchOrganizationForPortal(
    db,
    (att.organization_id as string) ?? "",
  );
  const orgName = (orgRow?.name as string | undefined) ?? "Containerly";
  const orgId = att.organization_id as string;
  const now = new Date();
  const dateStr = formatActivityDate(now);
  void shipRow;

  if (input.action === "reject") {
    const activityErr = await insertActivityEventOrFail(admin, {
      shipment_id: shipmentId,
      event_type: "documents_rejected",
      body: `${dateStr} — Document rejected: ${att.file_name}. Reason: ${input.rejection_reason!.trim()}`,
      actor_kind: "customer",
      actor_user_id: userId,
      metadata: {
        attachment_id: attachmentId,
        file_name: att.file_name as string,
        document_type: (att.document_type as string | null) ?? null,
        document_group: (att.document_group as string | null) ?? null,
        approval_status: "rejected",
        rejection_reason: input.rejection_reason!.trim(),
      },
    });
    if (activityErr) return activityErr;

    if (admin) {
      await notifyOperatorsDocumentRejected(admin, {
        organizationId: orgId,
        shipmentId,
        containerId: att.container_id as string | null,
        orgName,
        fileName: att.file_name as string,
        reason: input.rejection_reason!.trim(),
      });
    }
  } else {
    const perDocErr = await insertActivityEventOrFail(admin, {
      shipment_id: shipmentId,
      event_type: "documents_approved",
      body: `${dateStr} — Document approved: ${att.file_name}`,
      actor_kind: "customer",
      actor_user_id: userId,
      metadata: {
        attachment_id: attachmentId,
        file_name: att.file_name as string,
        document_type: (att.document_type as string | null) ?? null,
        document_group: (att.document_group as string | null) ?? null,
        approval_status: "approved",
      },
    });
    if (perDocErr) return perDocErr;

    if (workflowStatus === "approved") {
      const batchErr = await insertActivityEventOrFail(admin, {
        shipment_id: shipmentId,
        event_type: "documents_approved",
        body: `${dateStr} — Draft documents are approved — Please send to mailing address on file`,
        actor_kind: "customer",
        actor_user_id: userId,
        metadata: {
          shipment_id: shipmentId,
          approval_status: "approved",
        },
      });
      if (batchErr) return batchErr;

      if (admin) {
        await notifyOperatorsDocumentsApproved(admin, {
          organizationId: orgId,
          shipmentId,
          orgName,
        });
      }
    }
  }

  return {
    ok: true,
    attachment_id: attachmentId,
    approval_status: updated.approval_status as "approved" | "rejected",
    workflow_status: workflowStatus,
  };
}

export async function publishDraftDocuments(
  client: SupabaseClient,
  admin: SupabaseClient | null,
  shipmentId: string,
  userId: string,
  organizationId: string,
  fileCount = 1,
): Promise<void> {
  await updateShipmentCommercial(client, shipmentId, { workflow_status: "awaiting_review" });
  const now = new Date();
  await insertShipmentActivityEvent(client, {
    shipment_id: shipmentId,
    event_type: "drafts_attached",
    body: `${formatActivityDate(now)} — Drafts attached for approval`,
    actor_kind: "operator",
    actor_user_id: userId,
    metadata: {},
  });

  const db = admin ?? client;
  try {
    await notifyOperatorsDraftsPublished(db, {
      organizationId,
      shipmentId,
      actorUserId: userId,
      fileCount,
    });
  } catch {
    /* best-effort */
  }
}

export async function recordShipmentCreated(
  client: SupabaseClient,
  organizationId: string,
  shipmentId: string,
  userId: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  await insertShipmentActivityEvent(client, {
    shipment_id: shipmentId,
    event_type: "shipment_created",
    body: "Shipment created",
    actor_kind: "operator",
    actor_user_id: userId,
    metadata,
  });

  try {
    await notifyForShipmentActivityEvent({
      client,
      organizationId,
      shipmentId,
      actorUserId: userId,
      eventType: "shipment_created",
      metadata,
    });
  } catch {
    /* best-effort */
  }
}

export async function recordOriginalsMailed(
  client: SupabaseClient,
  shipmentId: string,
  trackingNumber: string | null,
  userId: string,
): Promise<void> {
  const now = new Date();
  const when = formatActivityDate(now);

  await insertShipmentActivityEvent(client, {
    shipment_id: shipmentId,
    event_type: "originals_mailed",
    body: `${when} — Original documents have been mailed`,
    actor_kind: "operator",
    actor_user_id: userId,
    metadata: { document_group: "original" },
  });

  const trimmed = trackingNumber?.trim() ?? "";
  if (trimmed) {
    await insertShipmentActivityEvent(client, {
      shipment_id: shipmentId,
      event_type: "originals_mailed",
      body: `${when} — Tracking number added: ${trimmed}`,
      actor_kind: "operator",
      actor_user_id: userId,
      metadata: {
        tracking_number: trimmed,
        document_group: "original",
      },
    });
  }
}

export { recomputeWorkflowStatus };

export async function persistShipmentWorkflowStatus(
  client: SupabaseClient,
  shipmentId: string,
): Promise<ShipmentWorkflowStatus> {
  const { data: containers, error: contErr } = await listContainersForShipment(client, shipmentId);
  if (contErr) throw contErr;
  const containerIds = (containers ?? []).map((c) => c.id as string);
  const workflowStatus = await recomputeWorkflowStatus(client, shipmentId, containerIds);
  const { error } = await client
    .from("shipments")
    .update({ workflow_status: workflowStatus })
    .eq("id", shipmentId);
  if (error) throw error;
  return workflowStatus;
}
