"use client";

import { Paperclip, Pencil, Reply, Trash2 } from "lucide-react";
import { useMemo, useRef } from "react";
import type { ReactNode } from "react";
import { ActionHoverTooltip } from "@/components/ActionHoverTooltip";
import { UserAvatar } from "@/components/UserAvatar";
import { MessageBody } from "@/components/MessageBody";
import { RichMessageEditor } from "@/components/RichMessageEditor";
import {
  ComposerPendingAttachmentChip,
  StoredMessageAttachmentPreview,
} from "@/components/MessageAttachmentPreviews";
import { WorkspacePostSpinner } from "@/components/WorkspacePostSpinner";
import {
  MAX_ATTACHMENT_SIZE_LABEL,
  MAX_ATTACHMENTS_PER_MESSAGE,
} from "@/utils/workspace-files";
import { formatTimestamp } from "@/utils/datetime";
import {
  buildMessageTree,
  truncatedReplyPreview,
  type ThreadNode,
} from "@/utils/report-message-tree";
import type { ReportMessage, WorkspaceAttachment } from "@/types/database";
import {
  THREAD_MESSAGE_AVATAR_CLASS,
  THREAD_OWN_COMPOSER_BG_CLASS,
  THREAD_TEAM_COMPOSER_BG_CLASS,
} from "./constants";
import {
  threadMessageAuthorAvatarUrl,
  threadMessageAuthorName,
  threadMessageAvatarClass,
  threadMessageAuthorHeadingClass,
  threadMessageBubbleClass,
  threadMessageContentPadClass,
  threadMessageCornerActionsClass,
  threadMessageIsOwn,
  threadMessagePalette,
  threadMessageQuoteClass,
  threadMessageQuoteShellClass,
  threadMessageReplyRingClass,
  threadMessageRowClass,
  threadMessageShellClass,
} from "./utils";
import { useThreadScrollToLatest } from "./useThreadScrollToLatest";

export { threadMessageAuthorName };

function ThreadMessageItem({
  node,
  depth,
  replyParentId,
  onReply,
  onDeleteMessage,
  onStartEditMessage,
  onCancelEditMessage,
  onSaveEditMessage,
  editingMessageId,
  editDraft,
  onEditDraftChange,
  messageById,
  authorNameByUserId,
  authorAvatarUrlByUserId,
  uploaderDisplayByUserId,
  currentUserId,
  deletingMessageId,
  savingEditMessageId,
  attachmentsByMessageId,
  onOpenAttachment,
  publicThreadMode = false,
  allowMessageDelete = true,
  allowMessageEdit = true,
  allowReply = true,
}: {
  node: ThreadNode<ReportMessage>;
  depth: number;
  replyParentId: string | null;
  onReply: (id: string) => void;
  onDeleteMessage: (id: string) => void;
  onStartEditMessage: (id: string) => void;
  onCancelEditMessage: () => void;
  onSaveEditMessage: (id: string) => void;
  editingMessageId: string | null;
  editDraft: string;
  onEditDraftChange: (value: string) => void;
  messageById: Map<string, ReportMessage>;
  authorNameByUserId: Record<string, string>;
  authorAvatarUrlByUserId: Record<string, string | null>;
  uploaderDisplayByUserId: Record<string, string>;
  currentUserId: string | null;
  deletingMessageId: string | null;
  savingEditMessageId: string | null;
  attachmentsByMessageId: Map<string, WorkspaceAttachment[]>;
  onOpenAttachment: (row: WorkspaceAttachment) => void;
  publicThreadMode?: boolean;
  allowMessageDelete?: boolean;
  allowMessageEdit?: boolean;
  allowReply?: boolean;
}) {
  const messageAttachments = attachmentsByMessageId.get(node.id) ?? [];
  const parent = node.parent_message_id ? messageById.get(node.parent_message_id) : undefined;
  const isReplyTarget = replyParentId === node.id;
  const isRoot = depth === 0;
  const isInternal = !publicThreadMode && node.is_internal;
  const palette = threadMessagePalette({ authorKind: node.author_kind });
  const isOwnMessage = threadMessageIsOwn({
    currentUserId,
    authorUserId: node.author_user_id,
  });
  const highlightOwnAsOperator =
    isOwnMessage && palette === "team" && (publicThreadMode || !isInternal);
  const isDeleting = deletingMessageId === node.id;
  const isEditing = editingMessageId === node.id;
  const isSavingEdit = savingEditMessageId === node.id;
  const actionsBusy = Boolean(deletingMessageId) || Boolean(savingEditMessageId);
  const showEdit = isOwnMessage && allowMessageEdit !== false;
  const authorLabel = threadMessageAuthorName(node, authorNameByUserId);
  const authorAvatarUrl = threadMessageAuthorAvatarUrl(node, authorAvatarUrlByUserId);

  const shell = threadMessageShellClass({ isRoot, palette, isOwnMessage, highlightOwnAsOperator });
  const avatarClass = threadMessageAvatarClass({
    isOwnMessage,
    highlightOwnAsOperator,
    palette,
    baseClass: THREAD_MESSAGE_AVATAR_CLASS,
  });

  const replyTargetRing = threadMessageReplyRingClass(palette);

  const avatar = (
    <UserAvatar
      imageUrl={authorAvatarUrl}
      label={authorLabel}
      size="lg"
      className={avatarClass}
    />
  );

  const bubble = (
    <div
      className={`${threadMessageBubbleClass(isOwnMessage)} ${shell} ${isReplyTarget ? replyTargetRing : ""}`}
    >
        {parent ? (
          <div
            className={`${threadMessageQuoteShellClass(isOwnMessage)} ${threadMessageQuoteClass(
              threadMessagePalette({ authorKind: parent.author_kind }),
            )}`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Replying to {threadMessageAuthorName(parent, authorNameByUserId)}
            </p>
            <p className="mt-1 truncate text-[13px] leading-snug text-zinc-600 dark:text-zinc-300">
              {truncatedReplyPreview(parent.body)}
            </p>
          </div>
        ) : null}
        <div className={threadMessageContentPadClass(isOwnMessage)}>
          <div
            className={`flex flex-wrap items-baseline gap-x-2 gap-y-0.5 ${isOwnMessage ? "justify-end" : ""}`}
          >
            <span
              className={threadMessageAuthorHeadingClass({
                palette,
                isOwnMessage,
                highlightOwnAsOperator,
              })}
            >
              {authorLabel}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {isInternal ? (
                <>
                  Internal note{" · "}
                </>
              ) : null}
              {formatTimestamp(node.created_at)}
            </span>
          </div>
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <RichMessageEditor
                value={editDraft}
                onChange={onEditDraftChange}
                onSubmit={() => onSaveEditMessage(node.id)}
                disabled={isSavingEdit}
                aria-label="Edit message"
              />
              <div className={`flex flex-wrap gap-2 ${isOwnMessage ? "justify-end" : ""}`}>
                <button
                  type="button"
                  onClick={() => onSaveEditMessage(node.id)}
                  disabled={isSavingEdit || !editDraft.trim()}
                  className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSavingEdit ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={onCancelEditMessage}
                  disabled={isSavingEdit}
                  className="rounded-md px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : node.body.trim() ? (
            <MessageBody text={node.body} className="mt-2" />
          ) : null}
          {messageAttachments.length > 0 ? (
            <ul
              className={`mt-2 flex min-w-0 flex-col gap-3 ${isOwnMessage ? "items-end" : ""}`}
            >
              {messageAttachments.map((att) => (
                <StoredMessageAttachmentPreview
                  key={att.id}
                  row={att}
                  uploaderLabel={uploaderDisplayByUserId[att.uploaded_by]?.trim() || "Unknown user"}
                  onOpen={() => onOpenAttachment(att)}
                />
              ))}
            </ul>
          ) : null}
        </div>
        <div className={threadMessageCornerActionsClass(isOwnMessage)}>
          {allowReply && !isEditing ? (
            <ActionHoverTooltip label="Reply">
              <button
                type="button"
                onClick={() => onReply(node.id)}
                disabled={actionsBusy || Boolean(editingMessageId)}
                aria-label="Reply to this message"
                className="group/msg-act inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors duration-200 ease-out hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-500 dark:hover:text-zinc-50"
              >
                <Reply
                  className="h-4 w-4 shrink-0 transition-[transform,color] duration-200 ease-out group-hover/msg-act:scale-[1.14]"
                  strokeWidth={2}
                  aria-hidden
                />
              </button>
            </ActionHoverTooltip>
          ) : null}
          {showEdit && !isEditing ? (
            <ActionHoverTooltip label="Edit">
              <button
                type="button"
                onClick={() => onStartEditMessage(node.id)}
                disabled={actionsBusy || Boolean(editingMessageId)}
                aria-label="Edit message"
                className="group/msg-act inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors duration-200 ease-out hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-500 dark:hover:text-zinc-50"
              >
                <Pencil
                  className="h-4 w-4 shrink-0 transition-[transform,color] duration-200 ease-out group-hover/msg-act:scale-[1.14]"
                  strokeWidth={2}
                  aria-hidden
                />
              </button>
            </ActionHoverTooltip>
          ) : null}
          {isOwnMessage && allowMessageDelete !== false && !isEditing ? (
            <ActionHoverTooltip label={isDeleting ? "Deleting…" : "Delete"}>
              <button
                type="button"
                aria-label={isDeleting ? "Deleting message…" : "Delete message"}
                disabled={actionsBusy}
                onClick={() => onDeleteMessage(node.id)}
                className="group/msg-act inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-red-600 transition-colors duration-200 ease-out hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-red-600 dark:text-red-500 dark:hover:text-red-100 dark:disabled:hover:text-red-500"
              >
                {isDeleting ? (
                  <span
                    className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent transition-colors duration-200"
                    aria-hidden
                  />
                ) : (
                  <Trash2
                    className="h-4 w-4 shrink-0 transition-[transform,color] duration-200 ease-out group-hover/msg-act:scale-[1.14]"
                    strokeWidth={2}
                    aria-hidden
                  />
                )}
              </button>
            </ActionHoverTooltip>
          ) : null}
        </div>
    </div>
  );

  return (
    <li className="list-none w-full">
      <div className={threadMessageRowClass(isOwnMessage)}>
        {isOwnMessage ? (
          <>
            {bubble}
            {avatar}
          </>
        ) : (
          <>
            {avatar}
            {bubble}
          </>
        )}
      </div>
      {node.children.length > 0 ? (
        <ul className="relative mt-4 flex flex-col gap-4 border-l-2 border-zinc-300 pl-5 dark:border-zinc-600">
          {node.children.map((c) => (
            <ThreadMessageItem
              key={c.id}
              node={c}
              depth={depth + 1}
              replyParentId={replyParentId}
              onReply={onReply}
              onDeleteMessage={onDeleteMessage}
              onStartEditMessage={onStartEditMessage}
              onCancelEditMessage={onCancelEditMessage}
              onSaveEditMessage={onSaveEditMessage}
              editingMessageId={editingMessageId}
              editDraft={editDraft}
              onEditDraftChange={onEditDraftChange}
              messageById={messageById}
              authorNameByUserId={authorNameByUserId}
              authorAvatarUrlByUserId={authorAvatarUrlByUserId}
              uploaderDisplayByUserId={uploaderDisplayByUserId}
              currentUserId={currentUserId}
              deletingMessageId={deletingMessageId}
              savingEditMessageId={savingEditMessageId}
              attachmentsByMessageId={attachmentsByMessageId}
              onOpenAttachment={onOpenAttachment}
              publicThreadMode={publicThreadMode}
              allowMessageDelete={allowMessageDelete}
              allowMessageEdit={allowMessageEdit}
              allowReply={allowReply}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function ThreadPanel({
  messages,
  authorNameByUserId,
  authorAvatarUrlByUserId = {},
  uploaderDisplayByUserId,
  body,
  onBodyChange,
  internalOnly,
  onInternalOnlyChange,
  posting,
  onPostMessage,
  replyParentId,
  onReplyParent,
  onClearReplyParent,
  currentUserId,
  onDeleteMessage,
  onStartEditMessage,
  onCancelEditMessage,
  onSaveEditMessage,
  editingMessageId = null,
  editDraft = "",
  onEditDraftChange,
  deletingMessageId,
  savingEditMessageId = null,
  attachmentsByMessageId,
  onOpenAttachment,
  composerPendingFiles,
  onComposerPickFiles,
  onRemoveComposerPendingFile,
  emptyStateText = "No messages yet.",
  threadStartBanner,
  /** When false, composer visibility is fixed by `internalOnly` (hide the internal/customer checkbox). */
  showInternalComposerToggle = true,
  /** Single public thread — no internal note labels, audience hints, or team/customer chrome. */
  publicThreadMode = false,
  /** When false, hide delete on the user's own messages (e.g. customer portal). */
  allowMessageDelete = true,
  allowMessageEdit = true,
  composerHidden = false,
  allowReply = true,
  pinToLatest = true,
}: {
  messages: ReportMessage[];
  authorNameByUserId: Record<string, string>;
  authorAvatarUrlByUserId?: Record<string, string | null>;
  uploaderDisplayByUserId: Record<string, string>;
  attachmentsByMessageId: Map<string, WorkspaceAttachment[]>;
  onOpenAttachment: (row: WorkspaceAttachment) => void;
  composerPendingFiles: File[];
  onComposerPickFiles: (files: FileList | null) => void;
  onRemoveComposerPendingFile: (index: number) => void;
  body: string;
  onBodyChange: (value: string) => void;
  internalOnly: boolean;
  onInternalOnlyChange: (value: boolean) => void;
  posting: boolean;
  onPostMessage: () => void;
  replyParentId: string | null;
  onReplyParent: (id: string) => void;
  onClearReplyParent: () => void;
  currentUserId: string | null;
  onDeleteMessage: (id: string) => void;
  onStartEditMessage?: (id: string) => void;
  onCancelEditMessage?: () => void;
  onSaveEditMessage?: (id: string) => void;
  editingMessageId?: string | null;
  editDraft?: string;
  onEditDraftChange?: (value: string) => void;
  deletingMessageId: string | null;
  savingEditMessageId?: string | null;
  /** Shown when there are no messages (e.g. scope hint). */
  emptyStateText?: string | null;
  /** Always-visible content rendered at the top of the scroll area (Discord-style "beginning of thread"). */
  threadStartBanner?: ReactNode;
  showInternalComposerToggle?: boolean;
  publicThreadMode?: boolean;
  allowMessageDelete?: boolean;
  allowMessageEdit?: boolean;
  /** Hide the composer (e.g. portal preview). Reply buttons follow `allowReply`. */
  composerHidden?: boolean;
  allowReply?: boolean;
  /** Pin the scroll viewport to the newest message when the tab is shown or messages grow. */
  pinToLatest?: boolean;
}) {
  const noop = () => {};
  const handleStartEdit = onStartEditMessage ?? noop;
  const handleCancelEdit = onCancelEditMessage ?? noop;
  const handleSaveEdit = onSaveEditMessage ?? noop;
  const handleEditDraftChange = onEditDraftChange ?? noop;

  const tree = useMemo(() => buildMessageTree(messages), [messages]);
  const messageById = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages]);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const composerFileInputRef = useRef<HTMLInputElement>(null);

  useThreadScrollToLatest({
    messagesScrollRef,
    messagesEndRef,
    messageCount: messages.length,
    pinToLatest,
  });

  const replyPreview = useMemo(() => {
    if (!replyParentId) return null;
    const m = messages.find((x) => x.id === replyParentId);
    if (!m) return null;
    return {
      label: threadMessageAuthorName(m, authorNameByUserId),
      excerpt: truncatedReplyPreview(m.body, 120),
    };
  }, [replyParentId, messages, authorNameByUserId]);

  const composerShell = internalOnly ? THREAD_TEAM_COMPOSER_BG_CLASS : THREAD_OWN_COMPOSER_BG_CLASS;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div
        ref={messagesScrollRef}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-auto p-5 sm:p-6"
      >
        {threadStartBanner ? <div className="mb-5">{threadStartBanner}</div> : null}

        {messages.length === 0 ? (
          emptyStateText ? (
            threadStartBanner ? (
              <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                {emptyStateText}
              </p>
            ) : (
              <div className="flex flex-1 items-center justify-center text-center">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{emptyStateText}</p>
              </div>
            )
          ) : null
        ) : (
          <ul className="flex flex-col gap-5">
            {tree.map((n) => (
              <ThreadMessageItem
                key={n.id}
                node={n}
                depth={0}
                replyParentId={replyParentId}
                onReply={onReplyParent}
                onDeleteMessage={onDeleteMessage}
                onStartEditMessage={handleStartEdit}
                onCancelEditMessage={handleCancelEdit}
                onSaveEditMessage={handleSaveEdit}
                editingMessageId={editingMessageId}
                editDraft={editDraft}
                onEditDraftChange={handleEditDraftChange}
                messageById={messageById}
                authorNameByUserId={authorNameByUserId}
                authorAvatarUrlByUserId={authorAvatarUrlByUserId}
                uploaderDisplayByUserId={uploaderDisplayByUserId}
                currentUserId={currentUserId}
                deletingMessageId={deletingMessageId}
                savingEditMessageId={savingEditMessageId}
                attachmentsByMessageId={attachmentsByMessageId}
                onOpenAttachment={onOpenAttachment}
                publicThreadMode={publicThreadMode}
                allowMessageDelete={allowMessageDelete}
                allowMessageEdit={allowMessageEdit}
                allowReply={allowReply}
              />
            ))}
          </ul>
        )}
        <div ref={messagesEndRef} aria-hidden className="h-px w-full shrink-0" />
      </div>
      {composerHidden ? null : (
      <div className="shrink-0 space-y-3 border-t border-zinc-100 bg-zinc-50/80 p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
        {replyPreview ? (
          <div className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-xs dark:border-zinc-700 dark:bg-zinc-950">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Replying to {replyPreview.label}
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-300">
                {replyPreview.excerpt}
              </p>
            </div>
            <button
              type="button"
              onClick={onClearReplyParent}
              className="shrink-0 text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline dark:hover:text-zinc-200"
            >
              Cancel
            </button>
          </div>
        ) : null}
        <div className={`text-sm ${composerShell}`}>
          {!publicThreadMode && internalOnly ? (
            <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">Internal note</p>
          ) : null}
          <div className="flex min-w-0 justify-center items-center gap-0.5">
            <input
              ref={composerFileInputRef}
              type="file"
              multiple
              className="sr-only"
              aria-label="Attach files to message"
              onChange={(e) => {
                onComposerPickFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              disabled={posting}
              onClick={() => composerFileInputRef.current?.click()}
              aria-label="Attach files"
              className={`mt-0.5 shrink-0 rounded-lg p-2 text-zinc-500 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                internalOnly
                  ? "hover:bg-emerald-900/10 hover:text-emerald-900 dark:hover:bg-emerald-500/15 dark:hover:text-emerald-100"
                  : "hover:bg-sky-900/8 hover:text-sky-950 dark:hover:bg-sky-400/15 dark:hover:text-sky-50"
              }`}
            >
              <Paperclip className="h-5 w-5" strokeWidth={2} aria-hidden />
            </button>
            <RichMessageEditor
              value={body}
              onChange={onBodyChange}
              onSubmit={() => {
                if ((!body.trim() && composerPendingFiles.length === 0) || posting) return;
                onPostMessage();
              }}
              disabled={posting}
              aria-label="Message"
            />
          </div>
          {composerPendingFiles.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-2 pl-1" aria-label="Files to attach">
              {composerPendingFiles.map((f, i) => (
                <ComposerPendingAttachmentChip
                  key={`${f.name}-${f.size}-${i}`}
                  file={f}
                  index={i}
                  disabled={posting}
                  uploading={posting}
                  onRemove={onRemoveComposerPendingFile}
                />
              ))}
            </ul>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          {showInternalComposerToggle ? (
            <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
              <input
                type="checkbox"
                checked={internalOnly}
                onChange={(e) => onInternalOnlyChange(e.target.checked)}
              />
              Internal note (hidden from importers)
            </label>
          ) : publicThreadMode ? null : (
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              {internalOnly
                ? "Team-only thread (not visible to importers)."
                : "Shared with importers on their portal."}
            </p>
          )}
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {posting ? (
              <span className="inline-flex items-center gap-2">
                <WorkspacePostSpinner />
                Posting…
              </span>
            ) : (
              <>
                Enter to send · Shift+Enter new line · Up to {MAX_ATTACHMENTS_PER_MESSAGE} files,{" "}
                {MAX_ATTACHMENT_SIZE_LABEL} each
              </>
            )}
          </p>
        </div>
      </div>
      )}
    </div>
  );
}
