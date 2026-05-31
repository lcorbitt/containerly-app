import { apiJson } from "@/utils/api-client";
import { readApiJson } from "@/utils/json-api";
import { collectMessageSubtreeIds } from "@/utils/report-message-tree";
import type { ReportMessage, WorkspaceAttachment } from "@/types/database";
import type {
  ContainerWorkspaceLoadResult,
  ContainerWorkspaceSnapshot,
  ShipmentScopeLoadResult,
  WorkspaceQuickSearchRow,
} from "@/types/workspace-load";

export type {
  ContainerWorkspaceLoadResult,
  ContainerWorkspaceSnapshot,
  ShipmentScopeLoadResult,
  WorkspaceQuickSearchRow,
};

// ---------------------------------------------------------------------------
// Storage signed URL (workspace-files bucket)
// ---------------------------------------------------------------------------

export async function createWorkspaceStorageSignedUrl(
  storagePath: string,
  expiresSec = 3600,
): Promise<string> {
  const { url } = await apiJson<{ url: string }>("/api/workspace/signed-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ storagePath, expiresSec }),
  });
  return url;
}

export async function openContainerWorkspaceAttachmentSignedUrl(storagePath: string): Promise<string> {
  return createWorkspaceStorageSignedUrl(storagePath, 3600);
}

export async function createWorkspaceAttachmentSignedUrl(storagePath: string): Promise<string> {
  return createWorkspaceStorageSignedUrl(storagePath, 3600);
}

// ---------------------------------------------------------------------------
// Container workspace
// ---------------------------------------------------------------------------

export async function loadContainerWorkspaceData(input: {
  containerId: string;
  organizationId: string;
}): Promise<ContainerWorkspaceLoadResult> {
  return apiJson<ContainerWorkspaceLoadResult>(
    `/api/organizations/${encodeURIComponent(input.organizationId)}/containers/${encodeURIComponent(input.containerId)}/workspace`,
  );
}

export async function deleteContainerReportMessage(input: { messageId: string }): Promise<void> {
  await apiJson<{ ok: true }>(`/api/report-messages/${encodeURIComponent(input.messageId)}`, {
    method: "DELETE",
  });
}

export async function postContainerWorkspaceMessage(input: {
  containerId: string;
  organizationId: string;
  body: string;
  internalOnly: boolean;
  replyParentId: string | null;
  files: File[];
}): Promise<{ message: ReportMessage; attachmentErrors: string[] }> {
  const formData = new FormData();
  formData.set("body", input.body);
  formData.set("internalOnly", input.internalOnly ? "true" : "false");
  formData.set("replyParentId", input.replyParentId ?? "");
  for (const f of input.files) {
    formData.append("file", f);
  }
  const res = await fetch(
    `/api/organizations/${encodeURIComponent(input.organizationId)}/containers/${encodeURIComponent(input.containerId)}/messages`,
    { method: "POST", body: formData, credentials: "include" },
  );
  return readApiJson<{ message: ReportMessage; attachmentErrors: string[] }>(res);
}

export async function uploadContainerWorkspaceDocuments(input: {
  containerId: string;
  organizationId: string;
  files: File[];
  isInternal: boolean;
}): Promise<{ inserted: WorkspaceAttachment[]; errors: string[] }> {
  const formData = new FormData();
  formData.set("isInternal", input.isInternal ? "true" : "false");
  for (const f of input.files) {
    formData.append("file", f);
  }
  const res = await fetch(
    `/api/organizations/${encodeURIComponent(input.organizationId)}/containers/${encodeURIComponent(input.containerId)}/documents`,
    { method: "POST", body: formData, credentials: "include" },
  );
  return readApiJson<{ inserted: WorkspaceAttachment[]; errors: string[] }>(res);
}

export async function renameContainerWorkspaceAttachment(input: {
  attachmentId: string;
  fileName: string;
}): Promise<void> {
  await apiJson(`/api/workspace-attachments/${encodeURIComponent(input.attachmentId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_name: input.fileName }),
  });
}

export async function removeContainerWorkspaceAttachment(input: {
  attachmentId: string;
  storagePath: string;
}): Promise<{ storageCleanupIncomplete: boolean }> {
  void input.storagePath;
  return apiJson<{ storageCleanupIncomplete: boolean }>(
    `/api/workspace-attachments/${encodeURIComponent(input.attachmentId)}`,
    { method: "DELETE" },
  );
}

// ---------------------------------------------------------------------------
// Shipment-scope workspace thread
// ---------------------------------------------------------------------------

export async function loadShipmentScopeThread(input: {
  organizationId: string;
  shipmentId: string;
}): Promise<ShipmentScopeLoadResult> {
  return apiJson<ShipmentScopeLoadResult>(
    `/api/organizations/${encodeURIComponent(input.organizationId)}/shipments/${encodeURIComponent(input.shipmentId)}/workspace-scope-thread`,
  );
}

export async function deleteShipmentScopeMessage(input: {
  messageId: string;
  messages: ReportMessage[];
}): Promise<{ deletedIds: Set<string> }> {
  const idsToRemove = collectMessageSubtreeIds(input.messages, input.messageId);
  await apiJson<{ ok: true }>(`/api/report-messages/${encodeURIComponent(input.messageId)}`, {
    method: "DELETE",
  });
  return { deletedIds: idsToRemove };
}

export async function postShipmentScopeMessageWithAttachments(input: {
  organizationId: string;
  shipmentId: string;
  body: string;
  internalOnly: boolean;
  replyParentId: string | null;
  files: File[];
}): Promise<{ messageId: string; attachmentErrors: string[] }> {
  const formData = new FormData();
  formData.set("body", input.body);
  formData.set("internalOnly", input.internalOnly ? "true" : "false");
  formData.set("replyParentId", input.replyParentId ?? "");
  for (const f of input.files) {
    formData.append("file", f);
  }
  const res = await fetch(
    `/api/organizations/${encodeURIComponent(input.organizationId)}/shipments/${encodeURIComponent(input.shipmentId)}/messages`,
    { method: "POST", body: formData, credentials: "include" },
  );
  return readApiJson<{ messageId: string; attachmentErrors: string[] }>(res);
}

export async function uploadShipmentScopeStandaloneFiles(input: {
  organizationId: string;
  shipmentId: string;
  files: File[];
  documentType?: string | null;
  documentGroup?: string | null;
}): Promise<WorkspaceAttachment[]> {
  const formData = new FormData();
  if (input.documentType) formData.set("documentType", input.documentType);
  if (input.documentGroup) formData.set("documentGroup", input.documentGroup);
  for (const f of input.files) {
    formData.append("file", f);
  }
  const res = await fetch(
    `/api/organizations/${encodeURIComponent(input.organizationId)}/shipments/${encodeURIComponent(input.shipmentId)}/documents`,
    { method: "POST", body: formData, credentials: "include" },
  );
  const data = await readApiJson<{ uploaded: WorkspaceAttachment[] }>(res);
  return data.uploaded ?? [];
}

export async function renameWorkspaceAttachmentDisplayName(
  attachmentId: string,
  trimmedName: string,
): Promise<void> {
  await apiJson(`/api/workspace-attachments/${encodeURIComponent(attachmentId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_name: trimmedName }),
  });
}

export async function removeWorkspaceAttachmentRow(row: WorkspaceAttachment): Promise<void> {
  await apiJson<{ storageCleanupIncomplete: boolean }>(
    `/api/workspace-attachments/${encodeURIComponent(row.id)}`,
    { method: "DELETE" },
  );
}

// ---------------------------------------------------------------------------
// Workspace quick search
// ---------------------------------------------------------------------------

export async function fetchWorkspaceQuickSearchBrowser(args: {
  organizationId: string;
  query: string;
  limit?: number;
}): Promise<WorkspaceQuickSearchRow[]> {
  const q = args.query.trim();
  if (q.length < 2) return [];
  const params = new URLSearchParams({
    q,
    limit: String(args.limit ?? 8),
  });
  const { results } = await apiJson<{ results: WorkspaceQuickSearchRow[] }>(
    `/api/organizations/${encodeURIComponent(args.organizationId)}/workspace-quick-search?${params}`,
  );
  return results ?? [];
}