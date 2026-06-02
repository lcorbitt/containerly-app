"use client";

import { useCallback, useMemo, useState } from "react";
import { buildAuthorAvatarUrlByUserId } from "@/components/WorkspaceThreadPanel/utils";
import { useQueryClient } from "@tanstack/react-query";
import {
  MAX_ATTACHMENT_FILE_BYTES,
  MAX_ATTACHMENT_SIZE_LABEL,
  MAX_ATTACHMENTS_PER_MESSAGE,
} from "@/utils/workspace-files";
import { collectMessageSubtreeIds } from "@/utils/report-message-tree";
import { useConfirm } from "@/contexts/confirm-dialog";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { useToast } from "@/contexts/toast";
import type { WorkspaceAttachment } from "@/types/database";
import {
  shipmentScopeThreadQueryKey,
  shipmentWorkspaceRowQueryKeyRoot,
  useShipmentScopeThreadQuery,
  useShipmentWorkspaceRowQuery,
} from "@/hooks/queries/useShipment";
import { orgMessageThreadsQueryKeyRoot } from "@/hooks/queries/useOrgMessageThreads";
import {
  createWorkspaceAttachmentSignedUrl,
  deleteShipmentScopeMessage,
  postShipmentScopeMessageWithAttachments,
} from "@/services/workspace.service";

export function useShipmentMessagesPanel({ shipmentId }: { shipmentId: string }) {
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const qc = useQueryClient();
  const { selectedOrgId } = useOrganizationWorkspace();
  const threadQuery = useShipmentScopeThreadQuery(selectedOrgId, shipmentId);
  const shipmentRowQuery = useShipmentWorkspaceRowQuery({
    shipmentId,
    organizationId: selectedOrgId,
  });

  const [body, setBody] = useState("");
  const [replyParentId, setReplyParentId] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [composerPendingFiles, setComposerPendingFiles] = useState<File[]>([]);

  const invalidateThread = useCallback(() => {
    if (selectedOrgId) {
      void qc.invalidateQueries({
        queryKey: shipmentScopeThreadQueryKey(selectedOrgId, shipmentId),
      });
      void qc.invalidateQueries({
        queryKey: [...orgMessageThreadsQueryKeyRoot, selectedOrgId],
      });
      void qc.invalidateQueries({
        queryKey: [...shipmentWorkspaceRowQueryKeyRoot, shipmentId],
      });
    }
  }, [qc, selectedOrgId, shipmentId]);

  const messages = threadQuery.data?.ok ? threadQuery.data.messages : [];
  const attachments = threadQuery.data?.ok ? threadQuery.data.attachments : [];
  const messageAuthorByUserId = threadQuery.data?.ok ? threadQuery.data.messageAuthorByUserId : {};
  const profileImagePathByUserId = threadQuery.data?.ok
    ? threadQuery.data.profileImagePathByUserId
    : {};
  const authorAvatarUrlByUserId = useMemo(
    () => buildAuthorAvatarUrlByUserId(profileImagePathByUserId),
    [profileImagePathByUserId],
  );
  const currentUserId = threadQuery.data?.ok ? threadQuery.data.currentUserId : null;

  const loadError =
    threadQuery.data && !threadQuery.data.ok
      ? threadQuery.data.error
      : threadQuery.error instanceof Error
        ? threadQuery.error.message
        : null;

  const loading = threadQuery.isLoading;
  const shipmentLabel =
    shipmentRowQuery.data && shipmentRowQuery.data.ok ? shipmentRowQuery.data.row.order_number : null;

  const threadMessages = useMemo(
    () => messages.filter((m) => !m.is_internal),
    [messages],
  );

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
      list.sort((x, y) => Date.parse(x.created_at) - Date.parse(y.created_at));
    }
    return m;
  }, [attachments]);

  const onComposerPickFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return;
      const incoming = Array.from(files);
      setComposerPendingFiles((prev) => {
        const cap = MAX_ATTACHMENTS_PER_MESSAGE;
        const room = cap - prev.length;
        if (room <= 0) {
          toast(`You can attach up to ${cap} files per message.`, "info");
          return prev;
        }
        const accepted = incoming.slice(0, room);
        if (incoming.length > accepted.length) {
          toast(`Only ${cap} files per message. ${incoming.length - accepted.length} file(s) were not added.`, "info");
        }
        return [...prev, ...accepted];
      });
    },
    [toast],
  );

  const onRemoveComposerPendingFile = useCallback((index: number) => {
    setComposerPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

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
      try {
        await deleteShipmentScopeMessage({ messageId, messages });
        setReplyParentId((prev) => {
          const ids = collectMessageSubtreeIds(messages, messageId);
          return prev && ids.has(prev) ? null : prev;
        });
        invalidateThread();
        toast("Message deleted", "success");
      } catch (e) {
        toast(e instanceof Error ? e.message : "Could not delete message", "error");
      } finally {
        setDeletingMessageId(null);
      }
    },
    [confirm, invalidateThread, messages, toast],
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
    for (const f of files) {
      if (f.size > MAX_ATTACHMENT_FILE_BYTES) {
        toast(`"${f.name}" exceeds the ${MAX_ATTACHMENT_SIZE_LABEL} size limit.`, "error");
        return;
      }
    }
    setPosting(true);
    try {
      const { attachmentErrors } = await postShipmentScopeMessageWithAttachments({
        organizationId: selectedOrgId,
        shipmentId,
        body: t,
        internalOnly: false,
        replyParentId,
        files,
      });
      for (const msg of attachmentErrors) {
        toast(msg, "error");
      }
      setBody("");
      setComposerPendingFiles([]);
      setReplyParentId(null);
      invalidateThread();
      toast("Message posted", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not post message", "error");
    } finally {
      setPosting(false);
    }
  }, [
    body,
    composerPendingFiles,
    invalidateThread,
    replyParentId,
    selectedOrgId,
    shipmentId,
    toast,
  ]);

  return {
    selectedOrgId,
    loading,
    loadError,
    shipmentLabel,
    threadMessages,
    messageAuthorByUserId,
    authorAvatarUrlByUserId,
    currentUserId,
    attachmentsByMessageId,
    openAttachment,
    composerPendingFiles,
    onComposerPickFiles,
    onRemoveComposerPendingFile,
    body,
    setBody,
    posting,
    postMessage,
    replyParentId,
    setReplyParentId,
    deleteMessage,
    deletingMessageId,
  };
}
