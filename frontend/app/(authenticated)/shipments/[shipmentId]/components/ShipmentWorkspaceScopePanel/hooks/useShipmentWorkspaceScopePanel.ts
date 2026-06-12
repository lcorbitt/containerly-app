"use client";

import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ATTACHMENT_DISPLAY_NAME_MAX_LEN, MAX_SHIPMENT_DOCUMENTS_UPLOAD_BATCH } from "@/utils/workspace-files";
import { DOCUMENT_TYPE_NONE_VALUE } from "../ShipmentDocumentUploadZone/constants";
import { useConfirm } from "@/atoms/confirm-dialog";
import { useOrganizationWorkspace } from "@/atoms/organization-workspace";
import { useToast } from "@/atoms/toast";
import type { WorkspaceAttachment } from "@/types/database";
import {
  shipmentScopeThreadQueryKey,
  shipmentWorkspaceRowQueryKeyRoot,
  useShipmentScopeThreadQuery,
} from "@/hooks/queries/useShipment";
import {
  createWorkspaceAttachmentSignedUrl,
  removeWorkspaceAttachmentRow,
  renameWorkspaceAttachmentDisplayName,
  uploadShipmentScopeStandaloneFiles,
} from "@/services/workspace.service";

export function useShipmentWorkspaceScopePanel({
  shipmentId,
}: {
  shipmentId: string;
}) {
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const qc = useQueryClient();
  const { selectedOrgId } = useOrganizationWorkspace();
  const threadQuery = useShipmentScopeThreadQuery(selectedOrgId, shipmentId);

  const [documentType, setDocumentType] = useState<string>(DOCUMENT_TYPE_NONE_VALUE);
  const [documentGroup, setDocumentGroup] = useState<"draft" | "revision" | "original">("draft");
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [removingAttachmentId, setRemovingAttachmentId] = useState<string | null>(null);
  const [renamingAttachmentId, setRenamingAttachmentId] = useState<string | null>(null);

  const invalidateThread = useCallback(() => {
    if (selectedOrgId) {
      void qc.invalidateQueries({
        queryKey: shipmentScopeThreadQueryKey(selectedOrgId, shipmentId),
      });
      void qc.invalidateQueries({
        queryKey: [...shipmentWorkspaceRowQueryKeyRoot, shipmentId, selectedOrgId],
      });
    }
  }, [qc, selectedOrgId, shipmentId]);

  const attachments = threadQuery.data?.ok ? threadQuery.data.attachments : [];
  const messageAuthorByUserId = threadQuery.data?.ok ? threadQuery.data.messageAuthorByUserId : {};
  const currentUserId = threadQuery.data?.ok ? threadQuery.data.currentUserId : null;

  const loadError =
    threadQuery.data && !threadQuery.data.ok
      ? threadQuery.data.error
      : threadQuery.error instanceof Error
        ? threadQuery.error.message
        : null;

  const loading = threadQuery.isLoading;

  const attachmentsNewestFirst = useMemo(() => {
    return [...attachments].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  }, [attachments]);

  const openAttachment = useCallback(
    async (row: WorkspaceAttachment) => {
      try {
        const url = await createWorkspaceAttachmentSignedUrl(row.storage_path);
        window.open(url, "_blank", "noopener,noreferrer");
      } catch (e) {
        toast(e instanceof Error ? e.message : "Could not open file", "error");
      }
    },
    [toast],
  );

  const uploadAttachmentFiles = useCallback(
    async (files: File[]): Promise<boolean> => {
      const queue = files.filter(Boolean).slice(0, MAX_SHIPMENT_DOCUMENTS_UPLOAD_BATCH);
      if (!queue.length || !selectedOrgId) return false;
      if (files.filter(Boolean).length > MAX_SHIPMENT_DOCUMENTS_UPLOAD_BATCH) {
        toast(`Only the first ${MAX_SHIPMENT_DOCUMENTS_UPLOAD_BATCH} files were included.`, "info");
      }
      setUploadingAttachments(true);
      try {
        const uploaded = await uploadShipmentScopeStandaloneFiles({
          organizationId: selectedOrgId,
          shipmentId,
          files: queue,
          documentType: documentType.trim() || null,
          documentGroup,
        });
        if (uploaded.length === 0) {
          toast("No files were uploaded.", "info");
          return false;
        }
        invalidateThread();
        toast(uploaded.length === 1 ? "File uploaded" : `${uploaded.length} files uploaded`, "success");
        return true;
      } catch (e) {
        toast(e instanceof Error ? e.message : "Upload failed", "error");
        return false;
      } finally {
        setUploadingAttachments(false);
      }
    },
    [selectedOrgId, shipmentId, documentType, documentGroup, invalidateThread, toast],
  );

  const renameAttachment = useCallback(
    async (attachmentId: string, rawName: string) => {
      const trimmed = rawName.trim();
      if (!trimmed) {
        toast("Enter a file name.", "error");
        throw new Error("empty name");
      }
      if (trimmed.length > ATTACHMENT_DISPLAY_NAME_MAX_LEN) {
        toast(`File name is too long (max ${ATTACHMENT_DISPLAY_NAME_MAX_LEN} characters).`, "error");
        throw new Error("name too long");
      }
      const row = attachments.find((a) => a.id === attachmentId);
      if (!row) throw new Error("Attachment not found");
      if (row.file_name === trimmed) return;
      setRenamingAttachmentId(attachmentId);
      try {
        await renameWorkspaceAttachmentDisplayName(attachmentId, trimmed);
        invalidateThread();
        toast("File name updated", "success");
      } catch (e) {
        toast(e instanceof Error ? e.message : "Could not rename file", "error");
        throw e;
      } finally {
        setRenamingAttachmentId(null);
      }
    },
    [attachments, toast, invalidateThread],
  );

  const removeAttachment = useCallback(
    async (attachmentId: string) => {
      const row = attachments.find((a) => a.id === attachmentId);
      if (!row) return;
      const ok = await confirm({
        title: "Delete Document?",
        description: `Permanently delete "${row.file_name}" from this shipment?`,
        confirmLabel: "Delete",
        cancelLabel: "Cancel",
        variant: "danger",
      });
      if (!ok) return;
      setRemovingAttachmentId(attachmentId);
      try {
        await removeWorkspaceAttachmentRow(row);
        invalidateThread();
        toast("Document deleted", "success");
      } catch (e) {
        toast(e instanceof Error ? e.message : "Could not delete document", "error");
      } finally {
        setRemovingAttachmentId(null);
      }
    },
    [attachments, confirm, invalidateThread, toast],
  );

  return {
    selectedOrgId,
    loading,
    loadError,

    documentType,
    setDocumentType,
    documentGroup,
    setDocumentGroup,

    messageAuthorByUserId,
    currentUserId,

    openAttachment,
    uploadAttachmentFiles,
    uploadingAttachments,
    renameAttachment,
    renamingAttachmentId,
    removeAttachment,
    removingAttachmentId,

    attachmentsNewestFirst,
  };
}
