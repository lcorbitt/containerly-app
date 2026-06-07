"use client";

import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ThreadPanel } from "@/components/WorkspaceThreadPanel";
import {
  ShipmentThreadStartBanner,
  SHIPMENT_THREAD_EMPTY_STATE_TEXT,
} from "@/components/WorkspaceThreadPanel/ShipmentThreadStartBanner";
import {
  SHIPMENT_MESSAGES_LOADING_CONTENT_CLASS,
  SHIPMENT_MESSAGES_LOADING_SHELL_CLASS,
  SHIPMENT_MESSAGES_LOADING_SPINNER_CLASS,
  SHIPMENT_MESSAGES_LOADING_TEXT,
  SHIPMENT_MESSAGES_LOADING_TEXT_CLASS,
  SHIPMENT_MESSAGES_PANEL_SHELL_CLASS,
  SHIPMENT_MESSAGES_THREAD_SHELL_CLASS,
} from "./constants";
import { useShipmentMessagesPanel } from "./useShipmentMessagesPanel";

export function ShipmentMessagesPanel({
  shipmentId,
  pinToLatest = true,
}: {
  shipmentId: string;
  /** Pass false when the messages tab is hidden so we re-pin when it opens (e.g. `?tab=messages`). */
  pinToLatest?: boolean;
}) {
  const searchParams = useSearchParams();
  const initialDraft = searchParams.get("draft");
  const {
    selectedOrgId,
    loading,
    loadError,
    shipmentLabel,
    threadMessages,
    messageAuthorByUserId,
    messageAuthorEmailByUserId,
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
    editingMessageId,
    editDraft,
    setEditDraft,
    startEditMessage,
    cancelEditMessage,
    saveEditMessage,
    savingEditMessageId,
  } = useShipmentMessagesPanel({ shipmentId, initialDraft, shouldMarkRead: pinToLatest });

  if (!selectedOrgId) {
    return (
      <div className="flex min-h-[min(24rem,calc(100dvh-20rem))] w-full items-center justify-center p-6 text-center">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Select an organization in the header to view shipment messages.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className={SHIPMENT_MESSAGES_LOADING_SHELL_CLASS}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className={SHIPMENT_MESSAGES_LOADING_CONTENT_CLASS}>
          <Loader2 className={SHIPMENT_MESSAGES_LOADING_SPINNER_CLASS} aria-hidden />
          <p className={SHIPMENT_MESSAGES_LOADING_TEXT_CLASS}>{SHIPMENT_MESSAGES_LOADING_TEXT}</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return <p className="p-4 text-sm text-red-600 dark:text-red-400 sm:p-5">{loadError}</p>;
  }

  return (
    <section aria-label="Shipment messages" className={SHIPMENT_MESSAGES_PANEL_SHELL_CLASS}>
      <div className={SHIPMENT_MESSAGES_THREAD_SHELL_CLASS}>
        <ThreadPanel
          key={shipmentId}
          messages={threadMessages}
          pinToLatest={pinToLatest}
          scrollComposerIntoView={pinToLatest}
          authorNameByUserId={messageAuthorByUserId}
          authorEmailByUserId={messageAuthorEmailByUserId}
          authorAvatarUrlByUserId={authorAvatarUrlByUserId}
          uploaderDisplayByUserId={messageAuthorByUserId}
          attachmentsByMessageId={attachmentsByMessageId}
          onOpenAttachment={(row) => void openAttachment(row)}
          composerPendingFiles={composerPendingFiles}
          onComposerPickFiles={onComposerPickFiles}
          onRemoveComposerPendingFile={onRemoveComposerPendingFile}
          body={body}
          onBodyChange={setBody}
          posting={posting}
          onPostMessage={() => void postMessage()}
          replyParentId={replyParentId}
          onReplyParent={setReplyParentId}
          onClearReplyParent={() => setReplyParentId(null)}
          currentUserId={currentUserId}
          onDeleteMessage={(id) => void deleteMessage(id)}
          onStartEditMessage={startEditMessage}
          onCancelEditMessage={cancelEditMessage}
          onSaveEditMessage={(id) => void saveEditMessage(id)}
          editingMessageId={editingMessageId}
          editDraft={editDraft}
          onEditDraftChange={setEditDraft}
          deletingMessageId={deletingMessageId}
          savingEditMessageId={savingEditMessageId}
          emptyStateText={SHIPMENT_THREAD_EMPTY_STATE_TEXT}
          threadStartBanner={<ShipmentThreadStartBanner shipmentLabel={shipmentLabel} />}
        />
      </div>
    </section>
  );
}
