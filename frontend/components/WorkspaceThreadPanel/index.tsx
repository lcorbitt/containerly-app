"use client";

import { Check, Paperclip, Pencil, Reply, Trash2, X } from "lucide-react";
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
import { formatShortTimestamp } from "@/utils/datetime";
import {
  buildMessageTree,
  truncatedReplyPreview,
  type ThreadNode,
} from "@/utils/report-message-tree";
import type { ReportMessage, WorkspaceAttachment } from "@/types/database";
import {
  THREAD_MESSAGE_AUTHOR_EMAIL_CLASS,
  THREAD_MESSAGE_AUTHOR_ROW_CLASS,
  THREAD_MESSAGE_AVATAR_CLASS,
  THREAD_MESSAGE_BUBBLE_CLASS,
  THREAD_MESSAGE_ACTION_DELETE_BUTTON_CLASS,
  THREAD_MESSAGE_ACTION_BUTTON_CLASS,
  THREAD_MESSAGE_ACTION_ICON_CLASS,
  THREAD_MESSAGE_ACTION_TOOLBAR_CLASS,
  THREAD_MESSAGE_ACTION_TOOLBAR_INNER_CLASS,
  THREAD_MESSAGE_CONTENT_PAD_CLASS,
  THREAD_MESSAGE_CONTENT_PAD_EDITING_CLASS,
  THREAD_MESSAGE_EDIT_ACTIONS_CLASS,
  THREAD_MESSAGE_QUOTE_SHELL_CLASS,
  THREAD_MESSAGE_TIMESTAMP_CLASS,
  THREAD_OWN_COMPOSER_BG_CLASS,
  THREAD_PANEL_COMPOSER_ID,
} from "./constants";
import {
  threadMessageAuthorAvatarUrl,
  threadMessageAuthorEmail,
  threadMessageAuthorHeadingClass,
  threadMessageAuthorName,
  threadMessageAvatarClass,
  threadMessageIsOwn,
  threadMessagePalette,
  threadMessageQuoteClass,
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
  authorEmailByUserId,
  authorAvatarUrlByUserId,
  uploaderDisplayByUserId,
  currentUserId,
  deletingMessageId,
  savingEditMessageId,
  attachmentsByMessageId,
  onOpenAttachment,
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
  authorEmailByUserId?: Record<string, string>;
  authorAvatarUrlByUserId: Record<string, string | null>;
  uploaderDisplayByUserId: Record<string, string>;
  currentUserId: string | null;
  deletingMessageId: string | null;
  savingEditMessageId: string | null;
  attachmentsByMessageId: Map<string, WorkspaceAttachment[]>;
  onOpenAttachment: (row: WorkspaceAttachment) => void;
  allowMessageDelete?: boolean;
  allowMessageEdit?: boolean;
  allowReply?: boolean;
}) {
  const messageAttachments = attachmentsByMessageId.get(node.id) ?? [];
  const parent = node.parent_message_id ? messageById.get(node.parent_message_id) : undefined;
  const isReplyTarget = replyParentId === node.id;
  const isRoot = depth === 0;
  const palette = threadMessagePalette({ authorKind: node.author_kind });
  const isOwnMessage = threadMessageIsOwn({
    currentUserId,
    authorUserId: node.author_user_id,
  });
  const isDeleting = deletingMessageId === node.id;
  const isEditing = editingMessageId === node.id;
  const isSavingEdit = savingEditMessageId === node.id;
  const actionsBusy = Boolean(deletingMessageId) || Boolean(savingEditMessageId);
  const showEdit = isOwnMessage && allowMessageEdit !== false;
  const authorLabel = threadMessageAuthorName(node, authorNameByUserId);
  const authorEmail = threadMessageAuthorEmail(node, authorEmailByUserId);
  const authorAvatarUrl = threadMessageAuthorAvatarUrl(node, authorAvatarUrlByUserId);

  const shell = threadMessageShellClass({ isRoot, palette, isOwnMessage });
  const avatarClass = threadMessageAvatarClass({
    isOwnMessage,
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

  const messageContent = (
    <div
      className={`${THREAD_MESSAGE_CONTENT_PAD_CLASS}${isEditing ? ` ${THREAD_MESSAGE_CONTENT_PAD_EDITING_CLASS}` : ""}`}
    >
      <div className="min-w-0">
        <div className={THREAD_MESSAGE_AUTHOR_ROW_CLASS}>
          <span
            className={threadMessageAuthorHeadingClass({
              palette,
              isOwnMessage,
            })}
          >
            {authorLabel}
          </span>
          <time dateTime={node.created_at} className={THREAD_MESSAGE_TIMESTAMP_CLASS}>
            {formatShortTimestamp(node.created_at)}
          </time>
        </div>
        {authorEmail ? (
          <p className={THREAD_MESSAGE_AUTHOR_EMAIL_CLASS} title={authorEmail}>
            {authorEmail}
          </p>
        ) : null}
      </div>
      {isEditing ? (
        <div className="mt-2">
          <RichMessageEditor
            value={editDraft}
            onChange={onEditDraftChange}
            onSubmit={() => onSaveEditMessage(node.id)}
            disabled={isSavingEdit}
            autoFocus
            aria-label="Edit message"
          />
        </div>
      ) : node.body.trim() ? (
        <MessageBody text={node.body} className="mt-2" />
      ) : null}
      {messageAttachments.length > 0 ? (
        <ul className={`mt-2 flex min-w-0 flex-col gap-3 ${isOwnMessage ? "items-end" : ""}`}>
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
  );

  const editActions = isEditing ? (
    <div className={THREAD_MESSAGE_EDIT_ACTIONS_CLASS}>
      <ActionHoverTooltip label={isSavingEdit ? "Saving…" : "Save"}>
        <button
          type="button"
          onClick={() => onSaveEditMessage(node.id)}
          disabled={isSavingEdit || !editDraft.trim()}
          aria-label={isSavingEdit ? "Saving message…" : "Save message"}
          className={THREAD_MESSAGE_ACTION_BUTTON_CLASS}
        >
          {isSavingEdit ? (
            <span
              className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent transition-colors duration-200"
              aria-hidden
            />
          ) : (
            <Check
              className={THREAD_MESSAGE_ACTION_ICON_CLASS}
              strokeWidth={2}
              aria-hidden
            />
          )}
        </button>
      </ActionHoverTooltip>
      <ActionHoverTooltip label="Cancel">
        <button
          type="button"
          onClick={onCancelEditMessage}
          disabled={isSavingEdit}
          aria-label="Cancel editing"
          className={THREAD_MESSAGE_ACTION_BUTTON_CLASS}
        >
          <X
            className={THREAD_MESSAGE_ACTION_ICON_CLASS}
            strokeWidth={2}
            aria-hidden
          />
        </button>
      </ActionHoverTooltip>
    </div>
  ) : null;

  const cornerActions = (
    <div className={THREAD_MESSAGE_ACTION_TOOLBAR_CLASS}>
      <div className={THREAD_MESSAGE_ACTION_TOOLBAR_INNER_CLASS} role="toolbar" aria-label="Message actions">
      {allowReply && !isEditing ? (
        <ActionHoverTooltip label="Reply">
          <button
            type="button"
            onClick={() => onReply(node.id)}
            disabled={actionsBusy || Boolean(editingMessageId)}
            aria-label="Reply to this message"
            className={THREAD_MESSAGE_ACTION_BUTTON_CLASS}
          >
            <Reply
              className={THREAD_MESSAGE_ACTION_ICON_CLASS}
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
            className={THREAD_MESSAGE_ACTION_BUTTON_CLASS}
          >
            <Pencil
              className={THREAD_MESSAGE_ACTION_ICON_CLASS}
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
            className={THREAD_MESSAGE_ACTION_DELETE_BUTTON_CLASS}
          >
            {isDeleting ? (
              <span
                className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent transition-colors duration-200"
                aria-hidden
              />
            ) : (
              <Trash2
                className={THREAD_MESSAGE_ACTION_ICON_CLASS}
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

  const bubble = (
    <div
      className={`${THREAD_MESSAGE_BUBBLE_CLASS} ${shell} ${isReplyTarget ? replyTargetRing : ""}`}
    >
        {cornerActions}
        {parent ? (
          <div
            className={`${THREAD_MESSAGE_QUOTE_SHELL_CLASS} ${threadMessageQuoteClass(
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
        {editActions}
        {messageContent}
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
              authorEmailByUserId={authorEmailByUserId}
              authorAvatarUrlByUserId={authorAvatarUrlByUserId}
              uploaderDisplayByUserId={uploaderDisplayByUserId}
              currentUserId={currentUserId}
              deletingMessageId={deletingMessageId}
              savingEditMessageId={savingEditMessageId}
              attachmentsByMessageId={attachmentsByMessageId}
              onOpenAttachment={onOpenAttachment}
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
  authorEmailByUserId,
  authorAvatarUrlByUserId = {},
  uploaderDisplayByUserId,
  body,
  onBodyChange,
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
  /** When false, hide delete on the user's own messages (e.g. customer portal). */
  allowMessageDelete = true,
  allowMessageEdit = true,
  composerHidden = false,
  allowReply = true,
  pinToLatest = true,
  scrollComposerIntoView = false,
}: {
  messages: ReportMessage[];
  authorNameByUserId: Record<string, string>;
  authorEmailByUserId?: Record<string, string>;
  authorAvatarUrlByUserId?: Record<string, string | null>;
  uploaderDisplayByUserId: Record<string, string>;
  attachmentsByMessageId: Map<string, WorkspaceAttachment[]>;
  onOpenAttachment: (row: WorkspaceAttachment) => void;
  composerPendingFiles: File[];
  onComposerPickFiles: (files: FileList | null) => void;
  onRemoveComposerPendingFile: (index: number) => void;
  body: string;
  onBodyChange: (value: string) => void;
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
  allowMessageDelete?: boolean;
  allowMessageEdit?: boolean;
  /** Hide the composer (e.g. portal preview). Reply buttons follow `allowReply`. */
  composerHidden?: boolean;
  allowReply?: boolean;
  /** Pin the scroll viewport to the newest message when the tab is shown or messages grow. */
  pinToLatest?: boolean;
  /** Scroll the page so the tabs card / composer are visible (e.g. shipment `?tab=messages`). */
  scrollComposerIntoView?: boolean;
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
    scrollComposerIntoView,
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
                authorEmailByUserId={authorEmailByUserId}
                authorAvatarUrlByUserId={authorAvatarUrlByUserId}
                uploaderDisplayByUserId={uploaderDisplayByUserId}
                currentUserId={currentUserId}
                deletingMessageId={deletingMessageId}
                savingEditMessageId={savingEditMessageId}
                attachmentsByMessageId={attachmentsByMessageId}
                onOpenAttachment={onOpenAttachment}
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
      <div
        id={THREAD_PANEL_COMPOSER_ID}
        className="shrink-0 space-y-3 border-t border-zinc-100 bg-zinc-50/80 p-5 dark:border-zinc-800 dark:bg-zinc-900/40"
      >
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
        <div className={`text-sm ${THREAD_OWN_COMPOSER_BG_CLASS}`}>
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
              className="mt-0.5 shrink-0 rounded-lg p-2 text-zinc-500 transition-colors hover:bg-sky-900/8 hover:text-sky-950 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-sky-400/15 dark:hover:text-sky-50"
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
        <div className="flex flex-wrap items-center justify-end gap-3">
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
