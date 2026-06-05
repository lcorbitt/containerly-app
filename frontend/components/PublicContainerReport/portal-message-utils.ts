import { profileDisplayName } from "@/utils/author-display-name";
import type { ReportMessage, WorkspaceAttachment } from "@/types/database";
import type { PortalAttachment, ThreadMessage } from "@shared/dto/shipment.dto";
import { publicThreadAuthorName } from "./utils";

export function portalThreadMessageToReportMessage(m: ThreadMessage): ReportMessage {
  return {
    id: m.id,
    organization_id: "",
    container_id: m.container_id ?? null,
    shipment_id: m.shipment_id ?? null,
    author_user_id: m.author_user_id ?? null,
    author_kind: m.author_kind,
    is_internal: m.is_internal ?? false,
    author_display_name: m.author_display_name,
    body: m.body,
    parent_message_id: m.parent_message_id,
    created_at: m.created_at,
    updated_at: m.created_at,
  };
}

export function portalAttachmentToWorkspaceAttachment(a: PortalAttachment): WorkspaceAttachment {
  return {
    id: a.id,
    organization_id: "",
    container_id: a.container_id ?? null,
    shipment_id: a.shipment_id ?? null,
    storage_path: a.storage_path,
    file_name: a.file_name,
    content_type: a.content_type,
    file_size_bytes: a.file_size_bytes ?? 0,
    uploaded_by: "",
    is_internal: false,
    report_message_id: a.report_message_id,
    document_type: a.document_type ?? null,
    document_group: a.document_group ?? null,
    approval_status: a.approval_status ?? null,
    rejection_reason: a.rejection_reason ?? null,
    reviewed_at: a.reviewed_at ?? null,
    shipment_line_id: a.shipment_line_id ?? null,
    uploaded_by_kind: a.uploaded_by_kind ?? null,
    created_at: a.created_at,
  };
}

export function buildPortalMessageAuthorMap(
  messages: ThreadMessage[],
  profileEmailByUserId?: Record<string, string>,
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const m of messages) {
    if (!m.author_user_id) continue;
    if (m.author_kind === "customer") {
      const email = profileEmailByUserId?.[m.author_user_id]?.trim();
      map[m.author_user_id] =
        m.author_display_name?.trim() ||
        (email ? profileDisplayName({ email }) : publicThreadAuthorName(m));
      continue;
    }
    map[m.author_user_id] = publicThreadAuthorName(m);
  }
  return map;
}

export function buildPortalMessageAuthorEmailMap(
  messages: ThreadMessage[],
  profileEmailByUserId?: Record<string, string>,
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const m of messages) {
    if (m.author_kind !== "customer" || !m.author_user_id) continue;
    const email = profileEmailByUserId?.[m.author_user_id]?.trim();
    if (email) map[m.author_user_id] = email;
  }
  return map;
}

export function buildPortalAttachmentsByMessageId(
  attachments: PortalAttachment[],
): Map<string, WorkspaceAttachment[]> {
  const byMessage = new Map<string, WorkspaceAttachment[]>();
  for (const row of attachments) {
    const messageId = row.report_message_id;
    if (!messageId) continue;
    const list = byMessage.get(messageId) ?? [];
    list.push(portalAttachmentToWorkspaceAttachment(row));
    byMessage.set(messageId, list);
  }
  return byMessage;
}
