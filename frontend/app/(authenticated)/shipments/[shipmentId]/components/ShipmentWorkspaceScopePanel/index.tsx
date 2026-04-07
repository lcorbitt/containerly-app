"use client";

import { FileText, MessageSquare, Users } from "lucide-react";
import { DocumentsList } from "@/components/DocumentsList";
import { ThreadPanel } from "@/components/WorkspaceThreadPanel";
import { ShipmentAccessTabContent } from "../ShipmentAccessTabContent";
import { WORKSPACE_TAB_PANEL_HEIGHT_CSS, workspaceTabButtonClass } from "@/utils/workspace-tab-panel";
import { useShipmentWorkspaceScopePanel } from "./hooks/useShipmentWorkspaceScopePanel";

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
  const {
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
  } = useShipmentWorkspaceScopePanel({ shipmentId });

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
              onRemoveComposerPendingFile={removeComposerPendingFile}
              body={body}
              onBodyChange={setBody}
              internalOnly={internalOnlyComposer}
              onInternalOnlyChange={() => {}}
              showInternalComposerToggle={false}
              posting={posting}
              onPostMessage={() => void postMessage()}
              replyParentId={replyParentId}
              onReplyParent={setReplyParentId}
              onClearReplyParent={clearReplyParent}
              currentUserId={currentUserId}
              onDeleteMessage={(id) => void deleteMessage(id)}
              deletingMessageId={deletingMessageId}
              composerAuthorLabel={composerAuthorLabel}
              emptyStateText={emptyStateText}
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
