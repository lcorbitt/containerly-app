import { EDGE_FUNCTION_SLUGS } from "@/lib/supabase/edge-function-slugs";
import { edgeFunctionFetch } from "@/lib/supabase/edge-functions";
import type { WorkspaceStoragePreviewVariant } from "@/utils/workspace-storage-preview";
import { collectMessageSubtreeIds } from "@/utils/report-message-tree";
import type { ReportMessage, WorkspaceAttachment } from "@/types/database";
import type {
  ContainerWorkspaceLoadResult,
  ContainerWorkspaceSnapshot,
  OrgShipmentMessageThreadsResult,
  ShipmentScopeLoadResult,
  WorkspaceQuickSearchRow,
} from "@/types/workspace-load";
import type {
  CreateWorkspaceSignedUrlResponse,
} from "@shared/dto/workspace.dto";

export type {
  ContainerWorkspaceLoadResult,
  ContainerWorkspaceSnapshot,
  OrgShipmentMessageThreadsResult,
  ShipmentScopeLoadResult,
  WorkspaceQuickSearchRow,
};

async function parseEdgeJson<T>(result: { res: Response; text: string }): Promise<T> {
  if (!result.res.ok) {
    let message = result.res.statusText;
    try {
      const parsed = JSON.parse(result.text) as { error?: string };
      if (parsed.error) message = parsed.error;
    } catch {
      if (result.text) message = result.text;
    }
    throw new Error(message);
  }
  return JSON.parse(result.text) as T;
}

async function edgeJson<T>(slug: string, init?: RequestInit): Promise<T> {
  const result = await edgeFunctionFetch(slug, init);
  if ("error" in result) throw new Error(result.error);
  return parseEdgeJson<T>(result);
}

async function edgeFormData<T>(slug: string, formData: FormData): Promise<T> {
  const result = await edgeFunctionFetch(slug, { method: "POST", body: formData });
  if ("error" in result) throw new Error(result.error);
  return parseEdgeJson<T>(result);
}

// ---------------------------------------------------------------------------
// Storage signed URL (workspace-files bucket)
// ---------------------------------------------------------------------------

export async function createWorkspaceStorageSignedUrl(
  storagePath: string,
  expiresSec = 3600,
  options?: { downloadFileName?: string; previewVariant?: WorkspaceStoragePreviewVariant },
): Promise<string> {
  const body = await edgeJson<CreateWorkspaceSignedUrlResponse>(
    EDGE_FUNCTION_SLUGS.workspace.createSignedUrl,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storage_path: storagePath,
        expires_sec: expiresSec,
        download_file_name: options?.downloadFileName,
        preview_variant: options?.previewVariant,
      }),
    },
  );
  return body.url;
}

/** Cached-friendly fetch; falls back to full-size URL if transform signing fails. */
export async function fetchWorkspaceStorageSignedUrl(
  storagePath: string,
  previewVariant: WorkspaceStoragePreviewVariant = "original",
): Promise<string> {
  try {
    return await createWorkspaceStorageSignedUrl(storagePath, 3600, { previewVariant });
  } catch (firstError) {
    if (previewVariant === "original") throw firstError;
    return createWorkspaceStorageSignedUrl(storagePath, 3600, { previewVariant: "original" });
  }
}

/** Triggers a browser download for a workspace attachment (any authenticated user with access). */
export async function downloadWorkspaceAttachment(
  storagePath: string,
  fileName: string,
): Promise<void> {
  const url = await createWorkspaceStorageSignedUrl(storagePath, 3600, {
    downloadFileName: fileName.trim() || "download",
  });
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.rel = "noopener noreferrer";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
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
  const params = new URLSearchParams({
    organization_id: input.organizationId,
    container_id: input.containerId,
  });
  return edgeJson<ContainerWorkspaceLoadResult>(
    `${EDGE_FUNCTION_SLUGS.workspace.getContainer}?${params}`,
  );
}

export async function patchReportMessage(input: {
  messageId: string;
  body: string;
}): Promise<ReportMessage> {
  const { message } = await edgeJson<{ message: ReportMessage }>(
    EDGE_FUNCTION_SLUGS.workspace.patchReportMessage,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message_id: input.messageId, body: input.body }),
    },
  );
  return message;
}

export async function deleteContainerReportMessage(input: { messageId: string }): Promise<void> {
  const params = new URLSearchParams({ message_id: input.messageId });
  await edgeJson<{ ok: true }>(
    `${EDGE_FUNCTION_SLUGS.workspace.deleteReportMessage}?${params}`,
    { method: "DELETE" },
  );
}

export async function postContainerWorkspaceMessage(input: {
  containerId: string;
  organizationId: string;
  body: string;
  replyParentId: string | null;
  files: File[];
}): Promise<{ message: ReportMessage; attachmentErrors: string[] }> {
  const formData = new FormData();
  formData.set("organization_id", input.organizationId);
  formData.set("container_id", input.containerId);
  formData.set("body", input.body);
  formData.set("internalOnly", "false");
  formData.set("replyParentId", input.replyParentId ?? "");
  for (const f of input.files) {
    formData.append("file", f);
  }
  return edgeFormData<{ message: ReportMessage; attachmentErrors: string[] }>(
    EDGE_FUNCTION_SLUGS.workspace.postContainerMessage,
    formData,
  );
}

export async function uploadContainerWorkspaceDocuments(input: {
  containerId: string;
  organizationId: string;
  files: File[];
  isInternal: boolean;
}): Promise<{ inserted: WorkspaceAttachment[]; errors: string[] }> {
  const formData = new FormData();
  formData.set("organization_id", input.organizationId);
  formData.set("container_id", input.containerId);
  formData.set("isInternal", input.isInternal ? "true" : "false");
  for (const f of input.files) {
    formData.append("file", f);
  }
  return edgeFormData<{ inserted: WorkspaceAttachment[]; errors: string[] }>(
    EDGE_FUNCTION_SLUGS.workspace.uploadContainerDocuments,
    formData,
  );
}

export async function renameContainerWorkspaceAttachment(input: {
  attachmentId: string;
  fileName: string;
}): Promise<void> {
  await edgeJson(EDGE_FUNCTION_SLUGS.workspace.patchAttachment, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attachment_id: input.attachmentId, file_name: input.fileName }),
  });
}

export async function removeContainerWorkspaceAttachment(input: {
  attachmentId: string;
  storagePath: string;
}): Promise<void> {
  void input.storagePath;
  const params = new URLSearchParams({ attachment_id: input.attachmentId });
  await edgeJson<{ ok: true }>(
    `${EDGE_FUNCTION_SLUGS.workspace.deleteAttachment}?${params}`,
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
  const params = new URLSearchParams({
    organization_id: input.organizationId,
    shipment_id: input.shipmentId,
  });
  return edgeJson<ShipmentScopeLoadResult>(
    `${EDGE_FUNCTION_SLUGS.workspace.getShipmentScopeThread}?${params}`,
  );
}

export async function fetchOrgShipmentMessageThreads(
  organizationId: string,
): Promise<OrgShipmentMessageThreadsResult> {
  const params = new URLSearchParams({ organization_id: organizationId });
  return edgeJson<OrgShipmentMessageThreadsResult>(
    `${EDGE_FUNCTION_SLUGS.workspace.listOrgShipmentMessageThreads}?${params}`,
  );
}

export async function markShipmentThreadRead(input: {
  organizationId: string;
  shipmentId: string;
}): Promise<void> {
  await edgeJson<{ ok: true }>(EDGE_FUNCTION_SLUGS.workspace.markShipmentThreadRead, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      organization_id: input.organizationId,
      shipment_id: input.shipmentId,
    }),
  });
}

export async function fetchImporterShipmentMessageThreads(): Promise<OrgShipmentMessageThreadsResult> {
  return edgeJson<OrgShipmentMessageThreadsResult>(
    EDGE_FUNCTION_SLUGS.workspace.listImporterShipmentMessageThreads,
  );
}

export async function markImporterShipmentThreadRead(input: { shipmentId: string }): Promise<void> {
  await edgeJson<{ ok: true }>(EDGE_FUNCTION_SLUGS.workspace.markImporterShipmentThreadRead, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shipment_id: input.shipmentId }),
  });
}

export async function deleteShipmentScopeMessage(input: {
  messageId: string;
  messages: ReportMessage[];
}): Promise<{ deletedIds: Set<string> }> {
  const idsToRemove = collectMessageSubtreeIds(input.messages, input.messageId);
  const params = new URLSearchParams({ message_id: input.messageId });
  await edgeJson<{ ok: true }>(
    `${EDGE_FUNCTION_SLUGS.workspace.deleteReportMessage}?${params}`,
    { method: "DELETE" },
  );
  return { deletedIds: idsToRemove };
}

export async function postShipmentScopeMessageWithAttachments(input: {
  organizationId: string;
  shipmentId: string;
  body: string;
  replyParentId: string | null;
  files: File[];
}): Promise<{ messageId: string; attachmentErrors: string[] }> {
  const formData = new FormData();
  formData.set("organization_id", input.organizationId);
  formData.set("shipment_id", input.shipmentId);
  formData.set("body", input.body);
  formData.set("internalOnly", "false");
  formData.set("replyParentId", input.replyParentId ?? "");
  for (const f of input.files) {
    formData.append("file", f);
  }
  return edgeFormData<{ messageId: string; attachmentErrors: string[] }>(
    EDGE_FUNCTION_SLUGS.workspace.postShipmentMessage,
    formData,
  );
}

export async function uploadShipmentScopeStandaloneFiles(input: {
  organizationId: string;
  shipmentId: string;
  files: File[];
  documentType?: string | null;
  documentGroup?: string | null;
}): Promise<WorkspaceAttachment[]> {
  const formData = new FormData();
  formData.set("organization_id", input.organizationId);
  formData.set("shipment_id", input.shipmentId);
  if (input.documentType) formData.set("documentType", input.documentType);
  if (input.documentGroup) formData.set("documentGroup", input.documentGroup);
  for (const f of input.files) {
    formData.append("file", f);
  }
  const data = await edgeFormData<{ uploaded: WorkspaceAttachment[] }>(
    EDGE_FUNCTION_SLUGS.workspace.uploadShipmentDocuments,
    formData,
  );
  return data.uploaded ?? [];
}

export async function renameWorkspaceAttachmentDisplayName(
  attachmentId: string,
  trimmedName: string,
): Promise<void> {
  await edgeJson(EDGE_FUNCTION_SLUGS.workspace.patchAttachment, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attachment_id: attachmentId, file_name: trimmedName }),
  });
}

export async function removeWorkspaceAttachmentRow(row: WorkspaceAttachment): Promise<void> {
  const params = new URLSearchParams({ attachment_id: row.id });
  await edgeJson<{ ok: true }>(
    `${EDGE_FUNCTION_SLUGS.workspace.deleteAttachment}?${params}`,
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
    organization_id: args.organizationId,
    q,
    limit: String(args.limit ?? 8),
  });
  const { results } = await edgeJson<{ results: WorkspaceQuickSearchRow[] }>(
    `${EDGE_FUNCTION_SLUGS.workspace.getQuickSearch}?${params}`,
  );
  return results ?? [];
}
