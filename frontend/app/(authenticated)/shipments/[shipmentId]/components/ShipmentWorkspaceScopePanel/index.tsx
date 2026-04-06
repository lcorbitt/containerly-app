"use client";

import { FileText, MessageSquare, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DocumentsList } from "@/components/documents-list";
import { ThreadPanel } from "@/components/workspace-thread-panel";
import {
  ATTACHMENT_DISPLAY_NAME_MAX_LEN,
  MAX_ATTACHMENT_FILE_BYTES,
  MAX_ATTACHMENT_SIZE_LABEL,
  MAX_ATTACHMENTS_PER_MESSAGE,
} from "@/lib/workspace-files";
import { useConfirm } from "@/contexts/confirm-dialog";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { useToast } from "@/contexts/toast";
import { collectMessageSubtreeIds } from "@/lib/report-message-tree";
import { ShipmentAccessTabContent } from "../ShipmentAccessTabContent";
import { WORKSPACE_TAB_PANEL_HEIGHT_CSS, workspaceTabButtonClass } from "@/lib/workspace-tab-panel";
import type { ReportMessage, WorkspaceAttachment } from "@/types/database";
import {
  shipmentScopeThreadQueryKey,
  useShipmentScopeThreadQuery,
} from "@/hooks/queries/use-shipment-scope-thread";
import {
  createWorkspaceAttachmentSignedUrl,
  deleteShipmentScopeMessage,
  insertShipmentScopeReportMessage,
  persistShipmentScopeAttachment,
  removeWorkspaceAttachmentRow,
  renameWorkspaceAttachmentDisplayName,
  uploadShipmentScopeStandaloneFiles,
} from "@/services/workspace-shipment-thread.service";

type Tab = "access" | "thread" | "documents";

type MessageChannel = "team" | "customer";

function scopeToggleClass(active: boolean) {
  return `inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
    active
      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
  }`;
}

export function ShipmentWorkspaceScopePanel({
  shipmentId,
  shipmentReference,
  initialAssigneeUserId,
  onShipmentMetaChanged,
}: {
  shipmentId: string;
  shipmentReference: string;
  initialAssigneeUserId: string | null;
  onShipmentMetaChanged: () => void;
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

  async function deleteMessage(messageId: string) {
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
  }

  async function postMessage() {
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
  }

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

  async function pickAttachmentFiles(files: FileList | null) {
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
  }

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

  async function removeAttachment(attachmentId: string) {
    const row = attachments.find((a) => a.id === attachmentId);
    if (!row) return;
    if (currentUserId && row.uploaded_by !== currentUserId) {
      toast("Only the person who uploaded the file can remove it.", "error");
      return;
    }
    const ok = await confirm({
      title: "Remove file?",
      description: `Permanently delete “${row.file_name}” from this shipment?`,
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
  }

  if (!selectedOrgId) {
    return (
      <p className="p-6 text-sm text-zinc-600 dark:text-zinc-400">
        Select an organization in the header to manage this shipment.
      </p>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto box-border flex min-h-0 w-full max-w-6xl flex-1 flex-col p-6">
        <p className="text-sm text-zinc-500">Loading shipment workspace…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto box-border flex w-full max-w-6xl flex-col px-6 pb-6">
      <div className="mb-3 rounded-lg border border-violet-200 bg-violet-50/80 px-4 py-3 text-sm text-violet-950 dark:border-violet-900/60 dark:bg-violet-950/25 dark:text-violet-100">
        <p className="font-medium">Entire shipment — {shipmentReference}</p>
        <p className="mt-1 text-xs text-violet-900/85 dark:text-violet-200/90">
          Messages and files here apply to the whole commercial shipment (all containers). Switch to a
          container line for unit-specific conversation and documents.
        </p>
      </div>

      <div
        className="flex w-full shrink-0 overflow-x-auto"
        role="tablist"
        aria-label="Shipment workspace"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "access"}
          className={workspaceTabButtonClass(tab === "access")}
          onClick={() => setTab("access")}
        >
          <Users className="h-4 w-4 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
          Team &amp; importers
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "thread"}
          className={workspaceTabButtonClass(tab === "thread")}
          onClick={() => setTab("thread")}
        >
          <MessageSquare className="h-4 w-4 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
          Shipment messages
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "documents"}
          className={workspaceTabButtonClass(tab === "documents")}
          onClick={() => setTab("documents")}
        >
          <FileText className="h-4 w-4 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
          Shipment documents
        </button>
      </div>
      <div
        className="flex min-h-0 flex-col overflow-hidden rounded-b-xl rounded-t-none border border-t-0 border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
        role="tabpanel"
        style={{ height: WORKSPACE_TAB_PANEL_HEIGHT_CSS }}
      >
        {tab === "access" ? (
          <ShipmentAccessTabContent
            shipmentId={shipmentId}
            initialAssigneeUserId={initialAssigneeUserId}
            onMetaChanged={onShipmentMetaChanged}
          />
        ) : null}
        {tab === "thread" ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div
              className="flex shrink-0 flex-wrap gap-2 border-b border-zinc-200 bg-zinc-50/80 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/40"
              role="tablist"
              aria-label="Message audience"
            >
              <button
                type="button"
                role="tab"
                aria-selected={messageChannel === "team"}
                className={scopeToggleClass(messageChannel === "team")}
                onClick={() => setMessageChannel("team")}
              >
                Team only
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={messageChannel === "customer"}
                className={scopeToggleClass(messageChannel === "customer")}
                onClick={() => setMessageChannel("customer")}
              >
                Customer portal
              </button>
            </div>
            <ThreadPanel
              messages={filteredThreadMessages}
              authorNameByUserId={messageAuthorByUserId}
              uploaderDisplayByUserId={messageAuthorByUserId}
              attachmentsByMessageId={attachmentsByMessageId}
              onOpenAttachment={(row) => void openAttachment(row)}
              onRenameAttachment={(id, name) => renameAttachment(id, name)}
              renamingAttachmentId={renamingAttachmentId}
              composerPendingFiles={composerPendingFiles}
              onComposerPickFiles={onComposerPickFiles}
              onRemoveComposerPendingFile={(index) =>
                setComposerPendingFiles((prev) => prev.filter((_, i) => i !== index))
              }
              body={body}
              onBodyChange={setBody}
              internalOnly={internalOnlyComposer}
              onInternalOnlyChange={() => {}}
              showInternalComposerToggle={false}
              posting={posting}
              onPostMessage={() => void postMessage()}
              replyParentId={replyParentId}
              onReplyParent={setReplyParentId}
              onClearReplyParent={() => setReplyParentId(null)}
              currentUserId={currentUserId}
              onDeleteMessage={(id) => void deleteMessage(id)}
              deletingMessageId={deletingMessageId}
              composerAuthorLabel={
                currentUserId && messageAuthorByUserId[currentUserId]
                  ? messageAuthorByUserId[currentUserId]!
                  : ""
              }
              emptyStateText={
                messageChannel === "team"
                  ? "No shipment-wide team messages yet."
                  : "No customer-visible shipment messages yet."
              }
            />
          </div>
        ) : null}
        {tab === "documents" ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div
              className="flex shrink-0 flex-wrap gap-2 border-b border-zinc-200 bg-zinc-50/80 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/40"
              role="tablist"
              aria-label="Document visibility"
            >
              <button
                type="button"
                role="tab"
                aria-selected={docChannel === "team"}
                className={scopeToggleClass(docChannel === "team")}
                onClick={() => setDocChannel("team")}
              >
                Team files
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={docChannel === "customer"}
                className={scopeToggleClass(docChannel === "customer")}
                onClick={() => setDocChannel("customer")}
              >
                Shared with customer
              </button>
            </div>
            <DocumentsList
              variant="embedded"
              currentUserId={currentUserId}
              storedFiles={attachmentsNewestFirst.map((a) => ({
                id: a.id,
                name: a.file_name,
                contentType: a.content_type,
                storagePath: a.storage_path,
                uploadedByUserId: a.uploaded_by,
                uploadedByLabel:
                  messageAuthorByUserId[a.uploaded_by]?.trim() || "Unknown user",
                onOpen: () => void openAttachment(a),
              }))}
              onPickFiles={(files) => void pickAttachmentFiles(files)}
              uploading={uploadingAttachments}
              onRemoveFile={(id) => void removeAttachment(id)}
              removingFileId={removingAttachmentId}
              onRenameFile={(id, name) => renameAttachment(id, name)}
              renamingFileId={renamingAttachmentId}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
