"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ATTACHMENT_DISPLAY_NAME_MAX_LEN,
  MAX_ATTACHMENT_FILE_BYTES,
  MAX_ATTACHMENT_SIZE_LABEL,
  MAX_ATTACHMENTS_PER_MESSAGE,
} from "@/utils/workspace-files";
import { useConfirm } from "@/contexts/confirm-dialog";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { useToast } from "@/contexts/toast";
import { collectMessageSubtreeIds } from "@/utils/report-message-tree";
import type { WorkspaceAttachment } from "@/types/database";
import {
  shipmentScopeThreadQueryKey,
  useShipmentScopeThreadQuery,
} from "@/hooks/queries/useShipment";
import {
  createWorkspaceAttachmentSignedUrl,
  deleteShipmentScopeMessage,
  insertShipmentScopeReportMessage,
  persistShipmentScopeAttachment,
  removeWorkspaceAttachmentRow,
  renameWorkspaceAttachmentDisplayName,
  uploadShipmentScopeStandaloneFiles,
} from "@/services/workspace.service";

type Tab = "access" | "thread" | "documents";

type MessageChannel = "team" | "customer";

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

  const [tab, setTab] = useState<Tab>("thread");
  const [body, setBody] = useState("");
  const [messageChannel, setMessageChannel] = useState<MessageChannel>("team");
  const [docChannel, setDocChannel] = useState<MessageChannel>("team");
  const [replyParentId, setReplyParentId] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [composerPendingFiles, setComposerPendingFiles] = useState<File[]>([]);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [removingAttachmentId, setRemovingAttachmentId] = useState<string | null>(null);
  const [renamingAttachmentId, setRenamingAttachmentId] = useState<string | null>(null);

  const invalidateThread = useCallback(() => {
    if (selectedOrgId) {
      void qc.invalidateQueries({
        queryKey: shipmentScopeThreadQueryKey(selectedOrgId, shipmentId),
      });
    }
  }, [qc, selectedOrgId, shipmentId]);

  const messages = threadQuery.data?.ok ? threadQuery.data.messages : [];
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

  const attachmentsByMessageId = useMemo(() => {
    const m = new Map<string, WorkspaceAttachment[]>();
    for (const a of attachments) {
      const mid = a.report_message_id;
      if (!mid) continue;
      const cur = m.get(mid) ?? [];
      cur.push(a);
      m.set(mid, cur);
    }
    for (const list of m.values()) {
      list.sort((x, y) => new Date(x.created_at).getTime() - new Date(y.created_at).getTime());
    }
    return m;
  }, [attachments]);

  const attachmentsNewestFirst = useMemo(() => {
    const scope = attachments.filter((a) => (docChannel === "team" ? a.is_internal : !a.is_internal));
    return scope.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  }, [attachments, docChannel]);

  const internalOnlyComposer = messageChannel === "team";

  const filteredThreadMessages = useMemo(
    () => messages.filter((m) => (messageChannel === "team" ? m.is_internal : !m.is_internal)),
    [messages, messageChannel],
  );

  useEffect(() => {
    if (!replyParentId) return;
    const ok = filteredThreadMessages.some((m) => m.id === replyParentId);
    if (!ok) setReplyParentId(null);
  }, [filteredThreadMessages, replyParentId]);

  const onComposerPickFiles = useCallback(
    (files: FileList | null) => {
      const raw = files ? Array.from(files) : [];
      if (!raw.length) return;
      setComposerPendingFiles((prev) => {
        const room = Math.max(0, MAX_ATTACHMENTS_PER_MESSAGE - prev.length);
        if (room === 0) {
          queueMicrotask(() =>
            toast(`You can attach up to ${MAX_ATTACHMENTS_PER_MESSAGE} files per message.`, "info"),
          );
          return prev;
        }
        const accepted: File[] = [];
        let oversized = 0;
        for (const f of raw) {
          if (f.size > MAX_ATTACHMENT_FILE_BYTES) {
            oversized += 1;
            continue;
          }
          if (accepted.length < room) accepted.push(f);
        }
        queueMicrotask(() => {
          if (oversized > 0) {
            toast(
              oversized === 1
                ? `That file exceeds the ${MAX_ATTACHMENT_SIZE_LABEL} size limit.`
                : `${oversized} files exceed the ${MAX_ATTACHMENT_SIZE_LABEL} size limit.`,
              "error",
            );
          }
        });
        if (accepted.length === 0) return prev;
        return [...prev, ...accepted];
      });
    },
    [toast],
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      const ok = await confirm({
        title: "Delete?",
        description:
          "This permanently removes the message. Any replies nested under it will be removed as well.",
        confirmLabel: "Delete",
        cancelLabel: "Cancel",
        variant: "danger",
      });
      if (!ok) return;
      setDeletingMessageId(messageId);
      const idsToRemove = collectMessageSubtreeIds(messages, messageId);
      try {
        await deleteShipmentScopeMessage({ messageId, messages });
        setReplyParentId((prev) => (prev && idsToRemove.has(prev) ? null : prev));
        invalidateThread();
        toast("Message deleted", "success");
      } catch (e) {
        toast(e instanceof Error ? e.message : "Could not delete message", "error");
      } finally {
        setDeletingMessageId(null);
      }
    },
    [confirm, messages, invalidateThread, toast],
  );

  const postMessage = useCallback(async () => {
    const t = body.trim();
    const files = [...composerPendingFiles];
    if (!t && files.length === 0) return;
    if (!selectedOrgId) return;
    if (files.length > MAX_ATTACHMENTS_PER_MESSAGE) {
      toast(`You can attach up to ${MAX_ATTACHMENTS_PER_MESSAGE} files per message.`, "info");
      return;
    }
    setPosting(true);
    try {
      const messageId = await insertShipmentScopeReportMessage({
        shipmentId,
        body: t,
        internalOnly: internalOnlyComposer,
        replyParentId,
      });
      const uid = currentUserId;
      if (!uid) return;
      for (const file of files) {
        try {
          await persistShipmentScopeAttachment({
            organizationId: selectedOrgId,
            shipmentId,
            userId: uid,
            file,
            reportMessageId: messageId,
            isInternal: internalOnlyComposer,
          });
        } catch (e) {
          toast(e instanceof Error ? e.message : "Could not upload an attachment", "error");
        }
      }
      setBody("");
      setComposerPendingFiles([]);
      setReplyParentId(null);
      invalidateThread();
      toast(internalOnlyComposer ? "Internal note posted" : "Message posted", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not post message", "error");
    } finally {
      setPosting(false);
    }
  }, [body, composerPendingFiles, selectedOrgId, shipmentId, internalOnlyComposer, replyParentId, currentUserId, invalidateThread, toast]);

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

  const pickAttachmentFiles = useCallback(
    async (files: FileList | null) => {
      const queue = files ? Array.from(files) : [];
      if (!queue.length || !selectedOrgId) return;
      setUploadingAttachments(true);
      try {
        const uploaded = await uploadShipmentScopeStandaloneFiles({
          organizationId: selectedOrgId,
          shipmentId,
          files: queue,
          isInternal: docChannel === "team",
        });
        if (uploaded.length === 0) {
          toast("No files were uploaded.", "info");
          return;
        }
        invalidateThread();
        toast(uploaded.length === 1 ? "File uploaded" : `${uploaded.length} files uploaded`, "success");
      } catch (e) {
        toast(e instanceof Error ? e.message : "Upload failed", "error");
      } finally {
        setUploadingAttachments(false);
      }
    },
    [selectedOrgId, shipmentId, docChannel, invalidateThread, toast],
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
      if (currentUserId && row.uploaded_by !== currentUserId) {
        toast("Only the person who uploaded the file can remove it.", "error");
        return;
      }
      const ok = await confirm({
        title: "Remove file?",
        description: `Permanently delete "${row.file_name}" from this shipment?`,
        confirmLabel: "Remove",
        cancelLabel: "Cancel",
        variant: "danger",
      });
      if (!ok) return;
      setRemovingAttachmentId(attachmentId);
      try {
        await removeWorkspaceAttachmentRow(row);
        invalidateThread();
        toast("File removed", "success");
      } catch (e) {
        toast(e instanceof Error ? e.message : "Could not remove file", "error");
      } finally {
        setRemovingAttachmentId(null);
      }
    },
    [attachments, currentUserId, confirm, invalidateThread, toast],
  );

  const removeComposerPendingFile = useCallback(
    (index: number) => setComposerPendingFiles((prev) => prev.filter((_, i) => i !== index)),
    [],
  );

  const clearReplyParent = useCallback(() => setReplyParentId(null), []);

  const composerAuthorLabel =
    currentUserId && messageAuthorByUserId[currentUserId]
      ? messageAuthorByUserId[currentUserId]!
      : "";

  const emptyStateText =
    messageChannel === "team"
      ? "No shipment-wide team messages yet."
      : "No customer-visible shipment messages yet.";

  return {
    selectedOrgId,
    loading,
    loadError,

    tab,
    setTab,

    messageChannel,
    setMessageChannel,
    docChannel,
    setDocChannel,

    body,
    setBody,
    posting,
    postMessage,
    internalOnlyComposer,

    replyParentId,
    setReplyParentId,
    clearReplyParent,

    filteredThreadMessages,
    messageAuthorByUserId,
    attachmentsByMessageId,
    currentUserId,

    deleteMessage,
    deletingMessageId,

    composerPendingFiles,
    onComposerPickFiles,
    removeComposerPendingFile,
    composerAuthorLabel,
    emptyStateText,

    openAttachment,
    pickAttachmentFiles,
    uploadingAttachments,
    renameAttachment,
    renamingAttachmentId,
    removeAttachment,
    removingAttachmentId,

    attachmentsNewestFirst,
  };
}
