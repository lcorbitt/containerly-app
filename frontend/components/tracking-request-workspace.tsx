"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  FileText,
  Map as MapIcon,
  MapPin,
  MessageSquare,
  Paperclip,
  Reply,
  Route,
  Share2,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActionHoverTooltip } from "@/components/action-hover-tooltip";
import { AutoGrowTextarea } from "@/components/auto-grow-textarea";
import { ContainerDetailsModal } from "@/components/container-details-modal";
import { ShipmentTrackingMapPanel } from "@/components/shipment-tracking-map";
import { DocumentsList } from "@/components/documents-list";
import {
  ATTACHMENT_DISPLAY_NAME_MAX_LEN,
  buildTrackingRequestAttachmentPath,
  MAX_ATTACHMENT_FILE_BYTES,
  MAX_ATTACHMENT_SIZE_LABEL,
  MAX_ATTACHMENTS_PER_MESSAGE,
  TRACKING_REQUEST_FILES_BUCKET,
} from "@/lib/tracking-request-attachments";
import {
  ComposerPendingAttachmentChip,
  StoredMessageAttachmentButton,
} from "@/components/message-attachment-previews";
import { PageLoading } from "@/components/page-loading";
import { ShareLinkRowActions } from "@/components/share-link-row-actions";
import { createClient } from "@/lib/supabase/client";
import { useConfirm } from "@/contexts/confirm-dialog";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { useToast } from "@/contexts/toast";
import {
  ContainerTimelineView,
  formatTimelineWhen,
  TimelineOrderToggle,
  useContainerTimelineOrder,
} from "@/components/container-timeline";
import {
  CarrierReportedStatusPill,
  ShareLinkStatePill,
  TrackingWorkflowStatusPill,
} from "@/components/status-pills";
import { computePublicReportInsights, riskInsightBadgeClass } from "@/lib/report-insights";
import { getShipmentDetailRows, shipperReceiverFromLocation } from "@/lib/jsoncargo-display";
import { profileDisplayName } from "@/lib/author-display-name";
import { formatMessageTimestamp } from "@/lib/format-message-timestamp";
import {
  buildMessageTree,
  collectMessageSubtreeIds,
  truncatedReplyPreview,
  type ThreadNode,
} from "@/lib/report-message-tree";
import type {
  ReportActivity,
  ReportMessage,
  SharedReport,
  TrackingRequest,
  TrackingRequestAttachment,
} from "@/types/database";
import type { PublicTimelineEvent } from "@/types/public-report";

const PRIMARY_BTN =
  "inline-flex h-9 items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900";

async function persistTrackingRequestAttachmentFile(
  supabase: ReturnType<typeof createClient>,
  args: {
    organizationId: string;
    trackingRequestId: string;
    userId: string;
    file: File;
    reportMessageId: string | null;
  },
): Promise<TrackingRequestAttachment> {
  const { organizationId, trackingRequestId, userId, file, reportMessageId } = args;
  if (file.size > MAX_ATTACHMENT_FILE_BYTES) {
    throw new Error(`${file.name} is too large (max ${MAX_ATTACHMENT_SIZE_LABEL})`);
  }
  const { path } = buildTrackingRequestAttachmentPath(organizationId, trackingRequestId, file);
  const { error: upErr } = await supabase.storage
    .from(TRACKING_REQUEST_FILES_BUCKET)
    .upload(path, file, {
      contentType: file.type || undefined,
      upsert: false,
    });
  if (upErr) throw new Error(upErr.message);

  const insertRow: {
    organization_id: string;
    tracking_request_id: string;
    storage_path: string;
    file_name: string;
    content_type: string | null;
    file_size_bytes: number;
    uploaded_by: string;
    report_message_id?: string;
  } = {
    organization_id: organizationId,
    tracking_request_id: trackingRequestId,
    storage_path: path,
    file_name: file.name,
    content_type: file.type || null,
    file_size_bytes: file.size,
    uploaded_by: userId,
  };
  if (reportMessageId) insertRow.report_message_id = reportMessageId;

  const { data: inserted, error: insErr } = await supabase
    .from("tracking_request_attachments")
    .insert(insertRow)
    .select()
    .single();
  if (insErr) {
    await supabase.storage.from(TRACKING_REQUEST_FILES_BUCKET).remove([path]);
    throw new Error(insErr.message);
  }
  if (!inserted) {
    await supabase.storage.from(TRACKING_REQUEST_FILES_BUCKET).remove([path]);
    throw new Error("Database did not return the new attachment row (check RLS SELECT on insert).");
  }
  return inserted as TrackingRequestAttachment;
}

/** Below ~xl: cap panel height so long lists scroll inside */
const PANEL_FIXED_H = "min-h-[min(520px,calc(100dvh-14rem))] max-h-[min(720px,calc(100dvh-12rem))]";

type MainTab = "timeline" | "map" | "thread" | "documents" | "report";

function PostSpinner() {
  return (
    <span
      className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden
    />
  );
}

function tabButtonClass(active: boolean) {
  return `inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
    active
      ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-50"
      : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
  }`;
}

const ACTIVITY_ACTION_LABELS: Record<string, string> = {
  public_view: "Public report viewed",
  customer_message: "Customer message on report",
};

function activityActionLabel(action: string): string {
  return ACTIVITY_ACTION_LABELS[action] ?? action.replace(/_/g, " ");
}

/** Resolves `shared_report_id` for display (title vs removed; short id disambiguates links). */
function activityLinkParts(
  sharedReportId: string | null,
  shareById: Map<string, SharedReport>,
): { primary: string } | null {
  if (!sharedReportId) return null;
  const share = shareById.get(sharedReportId);
  if (share) {
    const primary = share.title?.trim() || "Untitled link";
    return { primary };
  }
  return { primary: "Link removed from workspace" };
}

function ActivityList({
  activity,
  shareById,
  className,
}: {
  activity: ReportActivity[];
  shareById: Map<string, SharedReport>;
  className?: string;
}) {
  return (
    <ul className={`space-y-0 text-xs text-zinc-600 dark:text-zinc-400 ${className ?? ""}`}>
      {activity.length === 0 ? (
        <li className="py-2 text-zinc-500">No activity logged yet.</li>
      ) : (
        activity.map((a) => {
          const linkParts = activityLinkParts(a.shared_report_id, shareById);
          return (
            <li
              key={a.id}
              className="border-b border-zinc-100 py-2.5 last:border-0 dark:border-zinc-800"
            >
              <div>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {activityActionLabel(a.action)}
                </span>
                <span className="text-zinc-500"> · {formatMessageTimestamp(a.created_at)}</span>
              </div>
              {linkParts ? (
                <p className="mt-1 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                  <span className="text-zinc-600 dark:text-zinc-300">{linkParts.primary}</span>
                </p>
              ) : null}
            </li>
          );
        })
      )}
    </ul>
  );
}

function LinksPanel({
  title,
  onTitleChange,
  creating,
  onCreateShare,
  shares,
  origin,
  onDeleteShare,
  onToast,
}: {
  title: string;
  onTitleChange: (value: string) => void;
  creating: boolean;
  onCreateShare: () => void;
  shares: SharedReport[];
  origin: string;
  onDeleteShare: (id: string) => Promise<void>;
  onToast: (message: string, variant: "success" | "error" | "info") => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 space-y-3 border-b border-zinc-100 p-4 dark:border-zinc-800">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Title (optional)
            <input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              placeholder="e.g. ACME Corp — March shipment"
            />
          </label>
          <button
            type="button"
            onClick={onCreateShare}
            disabled={creating}
            className={`${PRIMARY_BTN} min-w-[9.25rem] shrink-0`}
          >
            {creating ? (
              <>
                <PostSpinner />
                <span>Creating…</span>
              </>
            ) : (
              <span>Create link</span>
            )}
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
        {shares.length === 0 ? (
          <p className="text-sm text-zinc-500">No share links yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {shares.map((s) => {
              const url = `${origin}/report/${s.id}`;
              const active = !s.revoked_at;
              return (
                <li
                  key={s.id}
                  className="flex flex-col gap-2 rounded-lg border border-zinc-100 p-3 dark:border-zinc-800 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xs break-all text-zinc-700 dark:text-zinc-300">{url}</p>
                    <p className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                      {!active ? <ShareLinkStatePill active={false} /> : null}
                      {s.title ? <span className="text-zinc-600 dark:text-zinc-400">{s.title}</span> : null}
                    </p>
                  </div>
                  <ShareLinkRowActions shareId={s.id} url={url} onDelete={onDeleteShare} onToast={onToast} />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function threadMessageAuthorName(m: ReportMessage, nameByUserId: Record<string, string>): string {
  if (m.author_kind === "system") return "System";
  if (m.author_kind === "customer") return m.author_display_name?.trim() || "Customer";
  const stored = m.author_display_name?.trim();
  if (stored) return stored;
  if (m.author_user_id && nameByUserId[m.author_user_id]) return nameByUserId[m.author_user_id]!;
  return "Team member";
}

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
  attachmentsByMessageId: Map<string, TrackingRequestAttachment[]>;
  onOpenAttachment: (row: TrackingRequestAttachment) => void;
  onRenameAttachment: (attachmentId: string, newName: string) => Promise<void>;
  renamingAttachmentId: string | null;
}) {
  const messageAttachments = attachmentsByMessageId.get(node.id) ?? [];
  const parent = node.parent_message_id ? messageById.get(node.parent_message_id) : undefined;
  const isReplyTarget = replyParentId === node.id;
  const isRoot = depth === 0;
  const isOwnMessage =
    Boolean(currentUserId && node.author_user_id && node.author_user_id === currentUserId);
  const isDeleting = deletingMessageId === node.id;
  const actionsBusy = Boolean(deletingMessageId);

  /* Conversation cards: no outline — soft blue (customer) vs green (internal), vs neutral timeline. */
  const shell = isRoot
    ? `group/card rounded-2xl px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)] ${
        node.is_internal
          ? "bg-emerald-50/85 dark:bg-emerald-950/30"
          : "bg-sky-50/90 dark:bg-sky-950/28"
      }`
    : `group/card rounded-xl px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.18)] ${
        node.is_internal
          ? "bg-emerald-50/55 dark:bg-emerald-950/22"
          : "bg-sky-50/55 dark:bg-sky-950/20"
      }`;

  const replyTargetRing = node.is_internal
    ? "ring-2 ring-emerald-400/45 ring-offset-2 ring-offset-emerald-50 dark:ring-emerald-500/35 dark:ring-offset-emerald-950"
    : "ring-2 ring-sky-400/45 ring-offset-2 ring-offset-sky-50 dark:ring-sky-500/35 dark:ring-offset-sky-950";

  const cornerActionsClass =
    "absolute top-0 right-1 z-10 flex items-center gap-0.5 rounded-md bg-transparent p-0.5 backdrop-blur-[2px] opacity-0 transition-opacity duration-200 ease-out group-hover/card:opacity-100 focus-within:opacity-100";

  return (
    <li className="list-none">
      <div
        className={`relative text-sm ${shell} ${isReplyTarget ? replyTargetRing : ""}`}
      >
        {parent ? (
          <div
            className={`mb-3 border-l-[3px] pl-3 pr-[6.25rem] ${
              parent.is_internal
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
              {node.is_internal ? (
                <>
                  Internal note{" · "}
                </>
              ) : null}
              {formatMessageTimestamp(node.created_at)}
            </span>
          </div>
          {node.body.trim() ? (
            <p className="mt-2 whitespace-pre-wrap leading-relaxed text-zinc-800 dark:text-zinc-200">{node.body}</p>
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
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function ThreadPanel({
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
}: {
  messages: ReportMessage[];
  authorNameByUserId: Record<string, string>;
  uploaderDisplayByUserId: Record<string, string>;
  attachmentsByMessageId: Map<string, TrackingRequestAttachment[]>;
  onOpenAttachment: (row: TrackingRequestAttachment) => void;
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
    return { label: threadMessageAuthorName(m, authorNameByUserId), excerpt: truncatedReplyPreview(m.body, 120) };
  }, [replyParentId, messages, authorNameByUserId]);

  const composerShell = internalOnly
    ? "rounded-2xl bg-emerald-50/85 px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] focus-within:ring-2 focus-within:ring-emerald-400/35 dark:bg-emerald-950/28 dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)] dark:focus-within:ring-emerald-500/30"
    : "rounded-2xl bg-sky-50/90 px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] focus-within:ring-2 focus-within:ring-sky-400/40 dark:bg-sky-950/28 dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)] dark:focus-within:ring-sky-500/35";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div ref={messagesScrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6">
        {messages.length === 0 ? (
          <p className="text-sm text-zinc-500">No messages yet.</p>
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
              <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-300">{replyPreview.excerpt}</p>
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
          {composerAuthorLabel.trim() || internalOnly ? (
            <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              {composerAuthorLabel.trim() ? (
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">{composerAuthorLabel}</span>
              ) : null}
              {internalOnly ? (
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
              placeholder="Message here… (optional if you attach files)"
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
          <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={internalOnly}
              onChange={(e) => onInternalOnlyChange(e.target.checked)}
            />
            Internal note (hidden on public report)
          </label>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {posting ? (
              <span className="inline-flex items-center gap-2">
                <PostSpinner />
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

type ContainerSnapshot = {
  status: string | null;
  carrier: string | null;
  location: Record<string, unknown> | null;
  last_synced_at: string | null;
};

export function TrackingRequestWorkspace({ requestId }: { requestId: string }) {
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const { selectedOrgId } = useOrganizationWorkspace();
  const [request, setRequest] = useState<TrackingRequest | null>(null);
  const [shares, setShares] = useState<SharedReport[]>([]);
  const [messages, setMessages] = useState<ReportMessage[]>([]);
  const [messageAuthorByUserId, setMessageAuthorByUserId] = useState<Record<string, string>>({});
  const [activity, setActivity] = useState<ReportActivity[]>([]);
  const [timeline, setTimeline] = useState<PublicTimelineEvent[]>([]);
  const timelineOrder = useContainerTimelineOrder(timeline);
  const [containerRow, setContainerRow] = useState<ContainerSnapshot | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [internalOnly, setInternalOnly] = useState(false);
  const [replyParentId, setReplyParentId] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [mainTab, setMainTab] = useState<MainTab>("timeline");
  const [containerDetailsModalOpen, setContainerDetailsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<TrackingRequestAttachment[]>([]);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [removingAttachmentId, setRemovingAttachmentId] = useState<string | null>(null);
  const [renamingAttachmentId, setRenamingAttachmentId] = useState<string | null>(null);
  const [composerPendingFiles, setComposerPendingFiles] = useState<File[]>([]);

  const attachmentsByMessageId = useMemo(() => {
    const m = new Map<string, TrackingRequestAttachment[]>();
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

        const eligible = raw.filter((f) => f.size <= MAX_ATTACHMENT_FILE_BYTES);
        const skippedForCap = eligible.length - accepted.length;

        queueMicrotask(() => {
          if (oversized > 0) {
            toast(
              oversized === 1
                ? `That file exceeds the ${MAX_ATTACHMENT_SIZE_LABEL} size limit.`
                : `${oversized} files exceed the ${MAX_ATTACHMENT_SIZE_LABEL} size limit.`,
              "error",
            );
          }
          if (skippedForCap > 0) {
            toast(
              `Only ${MAX_ATTACHMENTS_PER_MESSAGE} files per message. ${skippedForCap} file(s) were not added.`,
              "info",
            );
          }
        });

        if (accepted.length === 0) return prev;
        return [...prev, ...accepted];
      });
    },
    [toast],
  );

  const onRemoveComposerPendingFile = useCallback((index: number) => {
    setComposerPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const load = useCallback(
    async (opts?: { quiet?: boolean }) => {
      const quiet = opts?.quiet ?? false;
      if (!selectedOrgId) return;
      setLoadError(null);
      if (!quiet) setLoading(true);
      try {
        const supabase = createClient();
        const { data: u } = await supabase.auth.getUser();
        if (!u.user) {
          setContainerRow(null);
          setLoadError("Not signed in");
          return;
        }

        const { data: tr, error: trErr } = await supabase
          .from("tracking_requests")
          .select("*")
          .eq("id", requestId)
          .eq("organization_id", selectedOrgId)
          .maybeSingle();

        if (trErr) {
          setContainerRow(null);
          setLoadError(trErr.message);
          return;
        }
        if (!tr) {
          setRequest(null);
          setContainerRow(null);
          setLoadError("Tracking request not found for this workspace.");
          return;
        }
        setRequest(tr as TrackingRequest);

        const trRow = tr as TrackingRequest;
        const containerId = trRow.container_id;

        const [
          { data: sh },
          { data: msg },
          { data: act },
          { data: tev },
          attRes,
          containerResult,
        ] = await Promise.all([
          supabase
            .from("shared_reports")
            .select("*")
            .eq("tracking_request_id", requestId)
            .order("created_at", { ascending: false }),
          supabase
            .from("report_messages")
            .select("*")
            .eq("tracking_request_id", requestId)
            .order("created_at", { ascending: true }),
          supabase
            .from("report_activity")
            .select("*")
            .eq("tracking_request_id", requestId)
            .order("created_at", { ascending: false })
            .limit(200),
          supabase
            .from("tracking_events")
            .select(
              "id, event_type, status, location, occurred_at, created_at, container_id, tracking_request_id, raw_payload",
            )
            .eq("tracking_request_id", requestId)
            .order("occurred_at", { ascending: true })
            .limit(100),
          supabase
            .from("tracking_request_attachments")
            .select("*")
            .eq("tracking_request_id", requestId)
            .order("created_at", { ascending: false }),
          containerId
            ? supabase
                .from("containers")
                .select("status, carrier, location, last_synced_at")
                .eq("id", containerId)
                .maybeSingle()
            : Promise.resolve({ data: null }),
        ]);

        setShares((sh as SharedReport[]) ?? []);
        const msgList = (msg as ReportMessage[]) ?? [];
        setMessages(msgList);

        const attRows: TrackingRequestAttachment[] = attRes.error
          ? []
          : ((attRes.data as TrackingRequestAttachment[]) ?? []);

        const authorIds = [
          ...new Set(
            msgList.map((m) => m.author_user_id).filter((id): id is string => Boolean(id)),
          ),
        ];
        const uploaderIds = [...new Set(attRows.map((a) => a.uploaded_by))];
        const profileIds = [...new Set([...authorIds, ...uploaderIds])];

        let nameByUser: Record<string, string> = {};
        if (profileIds.length > 0) {
          const { data: profs } = await supabase
            .from("profiles")
            .select("id, email, full_name")
            .in("id", profileIds);
          for (const p of profs ?? []) {
            const id = p.id as string;
            nameByUser[id] = profileDisplayName({
              full_name: p.full_name as string | null,
              email: p.email as string | null,
            });
          }
        }
        setMessageAuthorByUserId(nameByUser);

        setActivity((act as ReportActivity[]) ?? []);
        setTimeline([...(tev as PublicTimelineEvent[] | null) ?? []]);
        if (attRes.error) {
          if (!quiet) {
            toast(`Could not load attachments: ${attRes.error.message}`, "error");
          }
        } else {
          setAttachments(attRows);
        }
        setContainerRow((containerResult.data as ContainerSnapshot | null) ?? null);
      } finally {
        if (!quiet) setLoading(false);
      }
    },
    [requestId, selectedOrgId, toast],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id ?? null);
    })();
  }, []);

  const shareById = useMemo(() => new Map(shares.map((s) => [s.id, s])), [shares]);
  const shipmentLoc = (containerRow?.location as Record<string, unknown> | null) ?? null;
  const carrierDetailRows = useMemo(() => getShipmentDetailRows(shipmentLoc), [shipmentLoc]);
  const shipperReceiver = useMemo(() => shipperReceiverFromLocation(shipmentLoc), [shipmentLoc]);
  const billOfLading = useMemo(() => {
    if (!shipmentLoc || typeof shipmentLoc !== "object") return "";
    const v = (shipmentLoc as Record<string, unknown>).bill_of_lading;
    return typeof v === "string" ? v.trim() : v != null ? String(v).trim() : "";
  }, [shipmentLoc]);
  const documentCount = (billOfLading ? 1 : 0) + attachments.length;
  const requestSummaryData = useMemo(() => {
    if (!request) return null;
    const carrierReportedStatus = containerRow?.status ?? request.status;
    const lastSyncedAt = containerRow?.last_synced_at ?? request.last_sync_at;
    const insights = computePublicReportInsights({ carrierReportedStatus, lastSyncedAt });
    const loc = containerRow?.location;
    const lastKnown =
      loc && typeof loc === "object"
        ? ((loc as Record<string, unknown>).last_location ??
            (loc as Record<string, unknown>).discharging_port ??
            (loc as Record<string, unknown>).loading_port ??
            null)
        : null;
    const freshText =
      insights.freshness_minutes != null
        ? insights.freshness_minutes < 120
          ? `${insights.freshness_minutes} min ago`
          : `${Math.round(insights.freshness_minutes / 60)} h ago`
        : "unknown";
    return { insights, lastKnown, freshText, carrier: containerRow?.carrier ?? null };
  }, [request, containerRow]);

  async function createShare() {
    if (!selectedOrgId || !request) return;
    setCreating(true);
    try {
      const supabase = createClient();
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { error } = await supabase.from("shared_reports").insert({
        organization_id: selectedOrgId,
        tracking_request_id: requestId,
        created_by: u.user.id,
        title: title.trim() || null,
        settings: { include_raw_external: false, include_alerts: true },
      });
      if (error) throw new Error(error.message);
      setTitle("");
      await load({ quiet: true });
      toast("Customer report link created", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not create link", "error");
    } finally {
      setCreating(false);
    }
  }

  async function deleteShareRow(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("shared_reports").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await load({ quiet: true });
  }

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
      const supabase = createClient();
      const { data: deletedRows, error } = await supabase
        .from("report_messages")
        .delete()
        .eq("id", messageId)
        .select("id");
      if (error) throw new Error(error.message);
      if (!deletedRows?.length) {
        throw new Error(
          "Could not delete this message. It may have already been removed, or you can only delete messages you posted.",
        );
      }
      setReplyParentId((prev) => (prev && idsToRemove.has(prev) ? null : prev));
      setMessages((prev) => prev.filter((m) => !idsToRemove.has(m.id)));
      await load({ quiet: true });
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
    for (const f of files) {
      if (f.size > MAX_ATTACHMENT_FILE_BYTES) {
        toast(`“${f.name}” exceeds the ${MAX_ATTACHMENT_SIZE_LABEL} size limit.`, "error");
        return;
      }
    }
    setPosting(true);
    try {
      const supabase = createClient();
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: selfProf } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", u.user.id)
        .maybeSingle();
      const displayName = profileDisplayName({
        full_name: selfProf?.full_name as string | null,
        email: (selfProf?.email as string | null) ?? u.user.email,
      });
      const { data: inserted, error } = await supabase
        .from("report_messages")
        .insert({
          tracking_request_id: requestId,
          author_user_id: u.user.id,
          author_kind: "member",
          author_display_name: displayName,
          is_internal: internalOnly,
          body: t,
          parent_message_id: replyParentId,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      if (!inserted) throw new Error("Message was not saved.");
      const messageId = (inserted as ReportMessage).id;

      for (const file of files) {
        try {
          await persistTrackingRequestAttachmentFile(supabase, {
            organizationId: selectedOrgId,
            trackingRequestId: requestId,
            userId: u.user.id,
            file,
            reportMessageId: messageId,
          });
        } catch (e) {
          toast(e instanceof Error ? e.message : "Could not upload an attachment", "error");
        }
      }

      setBody("");
      setComposerPendingFiles([]);
      setReplyParentId(null);
      await load({ quiet: true });
      toast(internalOnly ? "Internal note posted" : "Message posted", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not post message", "error");
    } finally {
      setPosting(false);
    }
  }

  const openAttachment = useCallback(
    async (row: TrackingRequestAttachment) => {
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from(TRACKING_REQUEST_FILES_BUCKET)
        .createSignedUrl(row.storage_path, 3600);
      if (error || !data?.signedUrl) {
        toast(error?.message ?? "Could not open file", "error");
        return;
      }
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    },
    [toast],
  );

  async function pickAttachmentFiles(files: FileList | null) {
    // Snapshot immediately: DocumentsList clears the input (`value=""`) right after onChange,
    // which empties the FileList before any await — so we must copy File refs synchronously.
    const queue = files ? Array.from(files) : [];
    if (!queue.length || !selectedOrgId) return;
    setUploadingAttachments(true);
    let uploadedCount = 0;
    try {
      const supabase = createClient();
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        toast("Sign in to upload files.", "error");
        return;
      }
      for (const file of queue) {
        try {
          const inserted = await persistTrackingRequestAttachmentFile(supabase, {
            organizationId: selectedOrgId,
            trackingRequestId: requestId,
            userId: u.user.id,
            file,
            reportMessageId: null,
          });
          uploadedCount += 1;
          setAttachments((prev) => [inserted, ...prev]);
        } catch (e) {
          toast(e instanceof Error ? e.message : "Upload failed", "error");
        }
      }
      if (uploadedCount === 0) {
        toast("No files were uploaded.", "info");
        return;
      }
      await load({ quiet: true });
      toast(uploadedCount === 1 ? "File uploaded" : `${uploadedCount} files uploaded`, "success");
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
      if (!row) {
        throw new Error("Attachment not found");
      }
      if (row.file_name === trimmed) {
        return;
      }
      setRenamingAttachmentId(attachmentId);
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from("tracking_request_attachments")
          .update({ file_name: trimmed })
          .eq("id", attachmentId);
        if (error) throw new Error(error.message);
        setAttachments((prev) =>
          prev.map((a) => (a.id === attachmentId ? { ...a, file_name: trimmed } : a)),
        );
        toast("File name updated", "success");
      } catch (e) {
        toast(e instanceof Error ? e.message : "Could not rename file", "error");
        throw e;
      } finally {
        setRenamingAttachmentId(null);
      }
    },
    [attachments, toast],
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
      description: `Permanently delete “${row.file_name}” from this request?`,
      confirmLabel: "Remove",
      cancelLabel: "Cancel",
      variant: "danger",
    });
    if (!ok) return;
    setRemovingAttachmentId(attachmentId);
    try {
      const supabase = createClient();
      const { error: dbErr } = await supabase
        .from("tracking_request_attachments")
        .delete()
        .eq("id", attachmentId);
      if (dbErr) throw new Error(dbErr.message);
      const { error: stErr } = await supabase.storage
        .from(TRACKING_REQUEST_FILES_BUCKET)
        .remove([row.storage_path]);
      if (stErr) {
        toast("File removed from the list; storage cleanup may be incomplete.", "info");
      }
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
      toast("File removed", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not remove file", "error");
    } finally {
      setRemovingAttachmentId(null);
    }
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  if (!selectedOrgId) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Select an organization in the header to manage this request.
      </p>
    );
  }

  if (loadError && !request) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>
        <Link href="/requests" className="mt-4 inline-block text-sm font-medium underline">
          Back to requests
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[min(420px,55dvh)] w-full max-w-6xl flex-col px-4 py-4 md:py-5">
        <PageLoading loadingText="Loading request…" />
      </div>
    );
  }

  if (!request) {
    return null;
  }

  const headerJumpClass =
    "text-xs font-medium text-zinc-600 underline-offset-4 transition-colors hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-200";

  const lastSyncLabel =
    request.last_sync_at != null
      ? formatTimelineWhen(request.last_sync_at)
      : containerRow?.last_synced_at != null
        ? formatTimelineWhen(containerRow.last_synced_at)
        : null;

  const carrierLastSyncedDisplay =
    containerRow?.last_synced_at != null
      ? formatMessageTimestamp(containerRow.last_synced_at)
      : request.last_sync_at != null
        ? formatMessageTimestamp(request.last_sync_at)
        : null;

  const carrierLastKnownDisplay =
    requestSummaryData?.lastKnown != null ? String(requestSummaryData.lastKnown) : null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-4 md:py-5">
      <header className="mb-6 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Container
              </p>
              <h1 className="mt-0.5 font-mono text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                #{request.container_number}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <TrackingWorkflowStatusPill status={request.status} />
                {requestSummaryData ? (
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${riskInsightBadgeClass(requestSummaryData.insights.risk_level)}`}
                  >
                    {requestSummaryData.insights.risk_level.toUpperCase()} risk
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:items-end">
              <div className="flex min-w-0 max-w-full flex-nowrap items-center gap-2 text-sm font-medium sm:max-w-2xl sm:justify-end">
                <MapPin className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" strokeWidth={2} aria-hidden />
                {shipperReceiver.shipper || shipperReceiver.receiver ? (
                  <>
                    <span className="min-w-0 flex-1 truncate text-zinc-800 sm:text-right dark:text-zinc-200">
                      {shipperReceiver.shipper ?? "—"}
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" strokeWidth={2} aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-zinc-800 sm:text-right dark:text-zinc-200">
                      {shipperReceiver.receiver ?? "—"}
                    </span>
                  </>
                ) : requestSummaryData?.lastKnown != null ? (
                  <span className="min-w-0 truncate text-zinc-600 dark:text-zinc-300">
                    {String(requestSummaryData.lastKnown)}
                  </span>
                ) : (
                  <span className="text-zinc-500 dark:text-zinc-400">Route not available yet</span>
                )}
              </div>
              <div className="flex flex-col gap-0.5 sm:items-end">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  Last updated {lastSyncLabel ?? "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)] lg:items-start">
        <div className="flex min-h-0 min-w-0 flex-col lg:min-h-[min(720px,calc(100dvh-12rem))]">
          <div
            className="flex shrink-0 gap-4 overflow-x-auto dark:border-zinc-800"
            role="tablist"
            aria-label="Request workspace"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mainTab === "timeline"}
              className={tabButtonClass(mainTab === "timeline")}
              onClick={() => setMainTab("timeline")}
            >
              <Route className="h-4 w-4 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
              Tracking
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mainTab === "map"}
              className={tabButtonClass(mainTab === "map")}
              onClick={() => setMainTab("map")}
            >
              <MapIcon className="h-4 w-4 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
              Map
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mainTab === "thread"}
              className={tabButtonClass(mainTab === "thread")}
              onClick={() => setMainTab("thread")}
            >
              <MessageSquare className="h-4 w-4 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
              Messages
              <span className="tabular-nums text-zinc-400">({messages.length})</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mainTab === "documents"}
              className={tabButtonClass(mainTab === "documents")}
              onClick={() => setMainTab("documents")}
            >
              <FileText className="h-4 w-4 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
              Documents
              <span className="tabular-nums text-zinc-400">({documentCount})</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mainTab === "report"}
              className={tabButtonClass(mainTab === "report")}
              onClick={() => setMainTab("report")}
            >
              <Share2 className="h-4 w-4 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
              Customer Reports
              <span className="tabular-nums text-zinc-400">({shares.length})</span>
            </button>
          </div>
          <div
            className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-b-xl rounded-t-none border border-t-none border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 ${PANEL_FIXED_H}`}
            role="tabpanel"
          >
            {mainTab === "timeline" ? (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  {timeline.length > 0 ? (
                    <div
                      className="sticky top-0 z-20 flex flex-wrap items-center justify-end gap-2 border-b border-zinc-200 bg-white px-3 py-2.5 sm:px-4 dark:border-zinc-800 dark:bg-zinc-950"
                      role="toolbar"
                      aria-label="Timeline options"
                    >
                      <TimelineOrderToggle
                        newestFirst={timelineOrder.newestFirst}
                        onToggle={timelineOrder.handleOrderToggle}
                      />
                      <span className="rounded-full border border-zinc-200/80 bg-white px-2.5 py-0.5 text-[11px] font-medium tabular-nums text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300">
                        {timeline.length} event{timeline.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  ) : null}
                  <div className="px-3 pb-3 pt-3 sm:px-4 sm:pb-4">
                    <ContainerTimelineView
                      events={timeline}
                      order={timelineOrder}
                      hideHeader
                      showOrderToggle={false}
                      className="shadow-none!"
                    />
                  </div>
                </div>
              </div>
            ) : null}
            {mainTab === "map" ? (
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain p-3 sm:p-4">
                <ShipmentTrackingMapPanel location={shipmentLoc} headingId="workspace-map-heading" />
              </div>
            ) : null}
            {mainTab === "thread" ? (
              <ThreadPanel
                messages={messages}
                authorNameByUserId={messageAuthorByUserId}
                uploaderDisplayByUserId={messageAuthorByUserId}
                attachmentsByMessageId={attachmentsByMessageId}
                onOpenAttachment={(row) => void openAttachment(row)}
                onRenameAttachment={(id, name) => renameAttachment(id, name)}
                renamingAttachmentId={renamingAttachmentId}
                composerPendingFiles={composerPendingFiles}
                onComposerPickFiles={onComposerPickFiles}
                onRemoveComposerPendingFile={onRemoveComposerPendingFile}
                body={body}
                onBodyChange={setBody}
                internalOnly={internalOnly}
                onInternalOnlyChange={setInternalOnly}
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
              />
            ) : null}
            {mainTab === "documents" ? (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <DocumentsList
                  variant="embedded"
                  billOfLading={billOfLading || undefined}
                  currentUserId={currentUserId}
                  storedFiles={attachments.map((a) => ({
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
            {mainTab === "report" ? (
              <LinksPanel
                title={title}
                onTitleChange={setTitle}
                creating={creating}
                onCreateShare={() => void createShare()}
                shares={shares}
                origin={origin}
                onDeleteShare={deleteShareRow}
                onToast={toast}
              />
            ) : null}
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Container Details</h2>
              <button
                type="button"
                onClick={() => setContainerDetailsModalOpen(true)}
                aria-label="Open container details"
                aria-haspopup="dialog"
                aria-expanded={containerDetailsModalOpen}
                className="group inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950"
              >
                <ArrowUpRight
                  className="h-4 w-4 origin-center text-zinc-500/80 transition-[color,transform] duration-[400ms] ease-in-out group-hover:scale-110 group-hover:text-zinc-900 dark:text-white/80 dark:group-hover:text-white"
                  strokeWidth={2}
                  aria-hidden
                />
              </button>
            </div>
            <dl className="space-y-3 px-4 py-4">
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                  Carrier
                </dt>
                <dd className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {requestSummaryData?.carrier?.trim() || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                  Carrier status
                </dt>
                <dd className="mt-1">
                  <CarrierReportedStatusPill status={containerRow?.status ?? request.status} />
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                  Last known location
                </dt>
                <dd className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">
                  {requestSummaryData?.lastKnown != null ? String(requestSummaryData.lastKnown) : "—"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 lg:max-h-[min(720px,calc(100dvh-12rem))]">
            <div className="shrink-0 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Activity</h2>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
              <ActivityList activity={activity} shareById={shareById} />
            </div>
          </div>
        </aside>
      </div>

      <ContainerDetailsModal
        open={containerDetailsModalOpen}
        onClose={() => setContainerDetailsModalOpen(false)}
        carrierName={requestSummaryData?.carrier?.trim() ? requestSummaryData.carrier.trim() : null}
        containerNumber={request.container_number}
        reportedStatus={containerRow?.status ?? request.status}
        lastKnownDisplay={carrierLastKnownDisplay}
        lastSyncedAtDisplay={carrierLastSyncedDisplay}
        detailRows={carrierDetailRows}
      />
    </div>
  );
}
