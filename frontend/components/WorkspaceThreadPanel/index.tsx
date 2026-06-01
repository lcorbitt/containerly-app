"use client";

import { Paperclip, Reply, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { ActionHoverTooltip } from "@/components/ActionHoverTooltip";
import { AutoGrowTextarea } from "@/components/AutoGrowTextarea";
import {
  ComposerPendingAttachmentChip,
  StoredMessageAttachmentButton,
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
import { threadMessageAuthorName } from "./utils";

export { threadMessageAuthorName };

function ThreadMessageItem({
  node,
  depth,
  replyParentId,
  onReply,
  onDeleteMessage,
  messageById,
  authorNameByUserId,
  uploaderDisplayByUserId,
  currentUserId,
  deletingMessageId,
  attachmentsByMessageId,
  onOpenAttachment,
  onRenameAttachment,
  renamingAttachmentId,
  publicThreadMode = false,
}: {
  node: ThreadNode<ReportMessage>;
  depth: number;
  replyParentId: string | null;
  onReply: (id: string) => void;
  onDeleteMessage: (id: string) => void;
  messageById: Map<string, ReportMessage>;
  authorNameByUserId: Record<string, string>;
  uploaderDisplayByUserId: Record<string, string>;
  currentUserId: string | null;
  deletingMessageId: string | null;
  attachmentsByMessageId: Map<string, WorkspaceAttachment[]>;
  onOpenAttachment: (row: WorkspaceAttachment) => void;
  onRenameAttachment: (attachmentId: string, newName: string) => Promise<void>;
  renamingAttachmentId: string | null;
  publicThreadMode?: boolean;
}) {
  const messageAttachments = attachmentsByMessageId.get(node.id) ?? [];
  const parent = node.parent_message_id ? messageById.get(node.parent_message_id) : undefined;
  const isReplyTarget = replyParentId === node.id;
  const isRoot = depth === 0;
  const isInternal = !publicThreadMode && node.is_internal;
  const parentInternal = !publicThreadMode && Boolean(parent?.is_internal);
  const isOwnMessage =
    Boolean(currentUserId && node.author_user_id && node.author_user_id === currentUserId);
  const isDeleting = deletingMessageId === node.id;
  const actionsBusy = Boolean(deletingMessageId);

  const shell = isRoot
    ? `group/card rounded-2xl px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)] ${
        isInternal
          ? "bg-emerald-50/85 dark:bg-emerald-950/30"
          : "bg-sky-50/90 dark:bg-sky-950/28"
      }`
    : `group/card rounded-xl px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.18)] ${
        isInternal
          ? "bg-emerald-50/55 dark:bg-emerald-950/22"
          : "bg-sky-50/55 dark:bg-sky-950/20"
      }`;

  const replyTargetRing = isInternal
    ? "ring-2 ring-emerald-400/45 ring-offset-2 ring-offset-emerald-50 dark:ring-emerald-500/35 dark:ring-offset-emerald-950"
    : "ring-2 ring-sky-400/45 ring-offset-2 ring-offset-sky-50 dark:ring-sky-500/35 dark:ring-offset-sky-950";

  const cornerActionsClass =
    "absolute top-0 right-1 z-10 flex items-center gap-0.5 rounded-md bg-transparent p-0.5 backdrop-blur-[2px] opacity-0 transition-opacity duration-200 ease-out group-hover/card:opacity-100 focus-within:opacity-100";

  return (
    <li className="list-none">
      <div className={`relative text-sm ${shell} ${isReplyTarget ? replyTargetRing : ""}`}>
        {parent ? (
          <div
            className={`mb-3 border-l-[3px] pl-3 pr-25 ${
              parentInternal
                ? "border-emerald-400/90 bg-emerald-100/35 py-1.5 dark:border-emerald-500/70 dark:bg-emerald-950/35"
                : "border-sky-400/90 bg-sky-100/40 py-1.5 dark:border-sky-500/70 dark:bg-sky-950/35"
            } rounded-r-md`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Replying to {threadMessageAuthorName(parent, authorNameByUserId)}
            </p>
            <p className="mt-1 truncate text-[13px] leading-snug text-zinc-600 dark:text-zinc-300">
              {truncatedReplyPreview(parent.body)}
            </p>
          </div>
        ) : null}
        <div className="min-w-0 pr-25">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {threadMessageAuthorName(node, authorNameByUserId)}
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
          {node.body.trim() ? (
            <p className="mt-2 whitespace-pre-wrap leading-relaxed text-zinc-800 dark:text-zinc-200">
              {node.body}
            </p>
          ) : null}
          {messageAttachments.length > 0 ? (
            <ul className="mt-2 flex flex-col gap-1.5">
              {messageAttachments.map((att) => (
                <StoredMessageAttachmentButton
                  key={att.id}
                  row={att}
                  uploaderLabel={uploaderDisplayByUserId[att.uploaded_by]?.trim() || "Unknown user"}
                  currentUserId={currentUserId}
                  renamingAttachmentId={renamingAttachmentId}
                  onOpen={() => onOpenAttachment(att)}
                  onRename={(newName) => onRenameAttachment(att.id, newName)}
                />
              ))}
            </ul>
          ) : null}
        </div>
        <div className={cornerActionsClass}>
          <ActionHoverTooltip label="Reply">
            <button
              type="button"
              onClick={() => onReply(node.id)}
              aria-label="Reply to this message"
              className="group/msg-act inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors duration-200 ease-out hover:text-zinc-100 dark:text-zinc-500 dark:hover:text-zinc-50"
            >
              <Reply
                className="h-4 w-4 shrink-0 transition-[transform,color] duration-200 ease-out group-hover/msg-act:scale-[1.14]"
                strokeWidth={2}
                aria-hidden
              />
            </button>
          </ActionHoverTooltip>
          {isOwnMessage ? (
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
              messageById={messageById}
              authorNameByUserId={authorNameByUserId}
              uploaderDisplayByUserId={uploaderDisplayByUserId}
              currentUserId={currentUserId}
              deletingMessageId={deletingMessageId}
              attachmentsByMessageId={attachmentsByMessageId}
              onOpenAttachment={onOpenAttachment}
              onRenameAttachment={onRenameAttachment}
              renamingAttachmentId={renamingAttachmentId}
              publicThreadMode={publicThreadMode}
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
  deletingMessageId,
  composerAuthorLabel,
  attachmentsByMessageId,
  onOpenAttachment,
  onRenameAttachment,
  renamingAttachmentId,
  composerPendingFiles,
  onComposerPickFiles,
  onRemoveComposerPendingFile,
  emptyStateText = "No messages yet.",
  /** When false, composer visibility is fixed by `internalOnly` (hide the internal/customer checkbox). */
  showInternalComposerToggle = true,
  /** Single public thread — no internal note labels, audience hints, or team/customer chrome. */
  publicThreadMode = false,
}: {
  messages: ReportMessage[];
  authorNameByUserId: Record<string, string>;
  uploaderDisplayByUserId: Record<string, string>;
  attachmentsByMessageId: Map<string, WorkspaceAttachment[]>;
  onOpenAttachment: (row: WorkspaceAttachment) => void;
  onRenameAttachment: (attachmentId: string, newName: string) => Promise<void>;
  renamingAttachmentId: string | null;
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
  deletingMessageId: string | null;
  composerAuthorLabel: string;
  /** Shown when there are no messages (e.g. scope hint). */
  emptyStateText?: string;
  showInternalComposerToggle?: boolean;
  publicThreadMode?: boolean;
}) {
  const tree = useMemo(() => buildMessageTree(messages), [messages]);
  const messageById = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages]);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const composerFileInputRef = useRef<HTMLInputElement>(null);
  const prevMessageCount = useRef<number | null>(null);

  useEffect(() => {
    if (prevMessageCount.current === null) {
      prevMessageCount.current = messages.length;
      return;
    }
    if (messages.length > prevMessageCount.current) {
      const el = messagesScrollRef.current;
      if (el) {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      }
    }
    prevMessageCount.current = messages.length;
  }, [messages]);

  const replyPreview = useMemo(() => {
    if (!replyParentId) return null;
    const m = messages.find((x) => x.id === replyParentId);
    if (!m) return null;
    return {
      label: threadMessageAuthorName(m, authorNameByUserId),
      excerpt: truncatedReplyPreview(m.body, 120),
    };
  }, [replyParentId, messages, authorNameByUserId]);

  const composerShell = internalOnly
    ? "rounded-2xl bg-emerald-50/85 px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] focus-within:ring-2 focus-within:ring-emerald-400/35 dark:bg-emerald-950/28 dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)] dark:focus-within:ring-emerald-500/30"
    : "rounded-2xl bg-sky-50/90 px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] focus-within:ring-2 focus-within:ring-sky-400/40 dark:bg-sky-950/28 dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)] dark:focus-within:ring-sky-500/35";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div ref={messagesScrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6">
        {messages.length === 0 ? (
          <p className="text-sm text-zinc-500">{emptyStateText}</p>
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
                messageById={messageById}
                authorNameByUserId={authorNameByUserId}
                uploaderDisplayByUserId={uploaderDisplayByUserId}
                currentUserId={currentUserId}
                deletingMessageId={deletingMessageId}
                attachmentsByMessageId={attachmentsByMessageId}
                onOpenAttachment={onOpenAttachment}
                onRenameAttachment={onRenameAttachment}
                renamingAttachmentId={renamingAttachmentId}
                publicThreadMode={publicThreadMode}
              />
            ))}
          </ul>
        )}
      </div>
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
          {composerAuthorLabel.trim() || (!publicThreadMode && internalOnly) ? (
            <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              {composerAuthorLabel.trim() ? (
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {composerAuthorLabel}
                </span>
              ) : null}
              {!publicThreadMode && internalOnly ? (
                <span className="text-xs text-zinc-500 dark:text-zinc-400">Internal note</span>
              ) : null}
            </div>
          ) : null}
          <div className="flex min-w-0 items-start gap-0.5">
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
            <AutoGrowTextarea
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter" || e.shiftKey) return;
                e.preventDefault();
                if ((!body.trim() && composerPendingFiles.length === 0) || posting) return;
                onPostMessage();
              }}
              disabled={posting}
              className="min-w-0 flex-1 border-0 bg-transparent py-1.5 pl-1 text-sm leading-relaxed text-zinc-800 placeholder:text-zinc-400 outline-none ring-0 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-200 dark:placeholder:text-zinc-500"
              placeholder="Message here…"
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
    </div>
  );
}
